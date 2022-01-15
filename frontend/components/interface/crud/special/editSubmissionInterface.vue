<template>
  <v-card flat>
    <slot name="toolbar"></slot>
    <v-card-text :class="{ 'max-height': dialogMode }" class="pt-3">
      <CircularLoader
        v-if="isLoading"
        style="min-height: 250px"
      ></CircularLoader>
      <v-container v-else class="px-0">
        <v-row>
          <v-col
            v-for="(inputObject, i) in actualVisibleInputsArray"
            :key="i"
            :cols="inputObject.cols || 12"
            class="py-0"
          >
            <GenericInput
              v-if="inputObject.fieldKey === 'timeElapsed'"
              :item="inputObject"
              :parent-item="currentItem"
              :all-items="inputsArray"
              @handle-submit="handleSubmit()"
              @keypress="isNumber($event)"
            ></GenericInput>
            <GenericInput
              v-else
              :item="inputObject"
              :parent-item="currentItem"
              :all-items="inputsArray"
              @handle-submit="handleSubmit()"
            ></GenericInput>
          </v-col>
        </v-row>
      </v-container>
    </v-card-text>

    <v-card-actions v-if="!isLoading">
      <v-spacer></v-spacer>
      <slot name="footer-action"></slot>
      <v-btn
        v-if="mode !== 'view'"
        ref="submit"
        color="primary"
        :loading="loading.editRecord"
        @click="handleSubmit()"
        >Submit</v-btn
      >
    </v-card-actions>
  </v-card>
</template>

<script>
import editRecordInterfaceMixin from '~/mixins/editRecordInterface'
import CircularLoader from '~/components/common/circularLoader.vue'
import { executeGiraffeql } from '~/services/giraffeql'
import { collapseObject, handleError } from '~/services/base'
import { getEventEras } from '~/services/dropdown'

export default {
  components: {
    CircularLoader,
  },
  mixins: [editRecordInterfaceMixin],

  computed: {
    actualVisibleInputsArray() {
      return this.inputsArray.filter((inputObject) => {
        // if no event, only show event input
        if (!this.event) return inputObject.fieldKey === 'event'

        return true
      })
    },

    event() {
      try {
        return this.getInputValue('event')
      } catch {
        return null
      }
    },

    timeElapsed() {
      try {
        return this.getInputValue('timeElapsed')
      } catch {
        return null
      }
    },
  },

  watch: {
    timeElapsed(val) {
      if (!val) return
      // if pasted value matches the correct format, don't do anything
      if (val.match(/^(\d+:)?([0-5]?\d:)?[0-5]?\d\.\d{1}$/)) return
      // if val is 1 or more digits only, parse
      if (val.match(/^\d+$/)) {
        return this.setInputValue('timeElapsed', this.parseTimeString(val))
      }
      // if val is 1 digit off from a correct string, must be due to a keyboard action. parse
      if (val.match(/^(\d+:)?(\d{1,2}:)?\d{1,2}\.\d{0,2}$/)) {
        return this.setInputValue('timeElapsed', this.parseTimeString(val))
      }
    },

    event(val) {
      // if event is changed to something non-null, reload the eventEra options
      const eventEraInputObject = this.getInputObject('eventEra')
      if (!val) {
        // if null, clear the eventEra options
        return (eventEraInputObject.options = [])
      }

      eventEraInputObject.loading = true
      getEventEras(this, false, [
        {
          'event.id': {
            eq: val.id,
          },
        },
      ]).then((res) => {
        this.getInputObject('eventEra').options = res
        // also set the current value to the isCurrent option
        this.setInputValue(
          'eventEra',
          res.find((ele) => ele.isCurrent)
        )
        eventEraInputObject.loading = false
      })
    },
  },

  methods: {
    isNumber(evt) {
      const charCode = evt.which ? evt.which : evt.keyCode
      if (charCode > 31 && (charCode < 48 || charCode > 57)) {
        evt.preventDefault()
      } else {
        return true
      }
    },

    // remove : and ., then apply them at appropriate places
    parseTimeString(str) {
      const strParts = [...str.replace(/\./g, '').replace(/:/g, '')]
      // if length <= 2, pad with 0s so min length is 3
      while (strParts.length < 2) {
        strParts.unshift('0')
      }
      // if length > 2, insert the "." before the 1st last digit
      strParts.splice(-1, 0, '.')
      // get rid of any excess leading 0s
      if (strParts.length === 4 && strParts[0] === '0') {
        strParts.shift()
      }
      // if length is greater than 5, add the ":"
      if (strParts.length > 4) {
        strParts.splice(-4, 0, ':')
        // if length is less than 9, no hours, so remove any leading 0s
        if (strParts.length < 8) {
          while (strParts[0] === '0') {
            strParts.shift()
          }
        }
      }
      // if length is greater than 8, add another ":"
      // and get rid of any leading 0s
      if (strParts.length > 7) {
        strParts.splice(-7, 0, ':')
        while (strParts[0] === '0') {
          strParts.shift()
        }
      }
      return strParts.join('')
    },

    async submit() {
      this.loading.editRecord = true
      try {
        const inputs = {}

        for (const inputObject of this.inputsArray) {
          inputs[inputObject.primaryField] = await this.processInputObject(
            inputObject
          )
        }

        // changed: set discordId field if first participant's discordId is populated
        if (inputs.participantsList.length > 0) {
          inputs.discordId = inputs.participantsList[0].discordId
        }

        // changed: if happenedOn field is empty, attempt to fetch it from the first externalLink, if it is an imgur link
        if (!inputs.happenedOn) {
          // check if the first externalLink follows the imgur pattern
          const externalLinksInputObject = this.getInputObject('externalLinks')

          const firstExternalLink =
            externalLinksInputObject.nestedInputsArray[0][0]?.inputObject.value

          if (firstExternalLink) {
            const regexMatch = firstExternalLink.match(
              /https:\/\/i.imgur.com\/(.*?)\..*/
            )

            if (regexMatch) {
              const imageData = await executeGiraffeql(this, {
                getImgurData: {
                  __args: regexMatch[1],
                },
              })

              inputs.happenedOn = imageData.datetime
            }
          }
        }

        // add/copy mode
        let query
        if (this.mode === 'add' || this.mode === 'copy') {
          query = {
            [this.recordInfo.addOptions.operationName ??
            'create' + this.capitalizedType]: {
              id: true,
              ...this.returnFields,
              __args: collapseObject(inputs),
            },
          }
        } else {
          query = {
            [this.recordInfo.editOptions.operationName ??
            'update' + this.capitalizedType]: {
              id: true,
              ...this.returnFields,
              __args: {
                item: {
                  id: this.selectedItem.id,
                },
                fields: collapseObject(inputs),
              },
            },
          }
        }
        const data = await executeGiraffeql(this, query)

        this.$notifier.showSnackbar({
          message:
            this.recordInfo.name +
            (this.mode === 'add' || this.mode === 'copy'
              ? ' Added'
              : ' Updated'),
          variant: 'success',
        })

        this.handleSubmitSuccess(data)

        // changed: if new submission was just added, open a preview dialog for it
        this.$root.$emit('openEditRecordDialog', {
          recordInfo: 'Public' + this.capitalizedType,
          mode: 'view',
          selectedItem: {
            id: data.id,
          },
        })

        // reset inputs
        this.resetInputs()
      } catch (err) {
        handleError(this, err)
      }
      this.loading.editRecord = false
    },
  },
}
</script>

<style scoped>
.max-height {
  max-height: 600px;
}
</style>

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
          <v-col v-if="mode === 'add'" cols="12" class="py-0">
            <v-text-field
              v-model="teamMembersInput"
              label="Time + Team Members (Express Input)"
              @change="handleTeamMembersInputChange"
            ></v-text-field>
          </v-col>
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
import {
  collapseObject,
  handleError,
  addNestedInputObject,
} from '~/services/base'
import { getEventEras } from '~/services/dropdown'

export default {
  components: {
    CircularLoader,
  },
  mixins: [editRecordInterfaceMixin],

  data() {
    return {
      teamMembersInput: null,
    }
  },

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
      if (!val) {
        // if null, clear the eventEra options
        return (this.getInputObject('eventEra').options = [])
      }

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
      })
    },
  },

  methods: {
    handleTeamMembersInputChange(val) {
      if (!val) return

      let timeStr
      let charactersStr

      const regexMatch = val.match(/^(\d|:|\.)*(\s*)-?(\s)*/)
      // if the string starts with some time-related digits, split it out and use that
      if (regexMatch) {
        timeStr = regexMatch[0].replace(/\s|-/g, '')
        charactersStr = val.replace(regexMatch[0], '')
      } else {
        charactersStr = val
      }

      // set the timeElapsed to timeStr if it exists
      if (timeStr) {
        // is the timeStr missing '.'? if so, need to calculate the worse tick
        if (!timeStr.match(/\./)) {
          const timeStrParts = timeStr.split(':')
          const seconds = Number(timeStrParts[0]) * 60 + Number(timeStrParts[1])
          let roundedSeconds = Number(
            (Math.ceil(seconds / 0.6) * 0.6).toFixed(1)
          )
          // if it is possible to add 0.6 without going one second higher, then do it
          if (Math.floor(roundedSeconds + 0.6) === roundedSeconds) {
            roundedSeconds += 0.6
          }

          // append the tens place digit to the timeStr
          const ticksSuffix = String(roundedSeconds).split('.')[1]
          timeStr += '.' + ticksSuffix
        }
        this.setInputValue('timeElapsed', timeStr)
      }

      // parse team members string and populate the participantsList based on those
      const characterNamesArray = charactersStr
        .split(',')
        .map((str) => str.trim())

      const participantsListInputObject =
        this.getInputObject('participantsList')
      // clear any existing nested inputs
      participantsListInputObject.nestedInputsArray = []

      characterNamesArray.forEach((charName) => {
        addNestedInputObject(participantsListInputObject, {
          discordId: null,
          characterId: charName,
        })
      })
    },

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

        // changed: only on add mode, set discordId field if first participant's discordId is populated
        if (this.mode === 'add' && inputs.participantsList.length > 0) {
          inputs.discordId = inputs.participantsList[0].discordId
        }

        // changed: if happenedOn field is empty, attempt to fetch it from the first externalLink, if it is an imgur link
        if (!inputs.happenedOn) {
          // find the first exteralLink that follows the imgur pattern, if any
          const externalLinksInputObject = this.getInputObject('externalLinks')

          const validImgurExternalLink =
            externalLinksInputObject.nestedInputsArray.find(
              (nestedInputObjectArray) => {
                const value = nestedInputObjectArray[0].inputObject.value
                console.log(value)
                if (!value) return false
                return value.match(/https:\/\/i.imgur.com\/(.*?)\..*/)
              }
            )[0]?.inputObject.value

          if (validImgurExternalLink) {
            const regexMatch = validImgurExternalLink.match(
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

        const eventEraInputObject = this.getInputObject('eventEra')
        // set the eventEra based on the happenedOn date
        const matchingEventEra = eventEraInputObject.options.find(
          (eventEra) => {
            return (
              inputs.happenedOn >= eventEra.beginDate &&
              (eventEra.endDate === null ||
                inputs.happenedOn <= eventEra.endDate)
            )
          }
        )

        if (!matchingEventEra) {
          throw new Error('No matching eventEra for the happenedOn date')
        }

        inputs['eventEra.id'] = matchingEventEra.id

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

        // this.handleSubmitSuccess(data)
        // changed:
        this.$emit('handleSubmit', data)

        // reset inputs
        // this.resetInputs()
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

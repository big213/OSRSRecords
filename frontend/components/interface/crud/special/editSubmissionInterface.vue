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
            v-for="(item, i) in actualVisibleInputsArray"
            :key="i"
            cols="12"
            class="py-0"
          >
            <GenericInput
              v-if="item.field === 'timeElapsed'"
              :item="item"
              :parent-item="currentItem"
              @handle-submit="handleSubmit()"
              @keypress="isNumber($event)"
            ></GenericInput>

            <GenericInput
              v-else
              :item="item"
              :parent-item="currentItem"
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

export default {
  components: {
    CircularLoader,
  },
  mixins: [editRecordInterfaceMixin],

  computed: {
    actualVisibleInputsArray() {
      return this.inputsArray.filter((inputObject) => {
        // if no event, only show event input
        if (!this.event) return inputObject.field === 'event.id'

        return true
      })
    },

    event() {
      try {
        return this.getInputValue('event.id')
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
          inputs[inputObject.field] = await this.processInputObject(inputObject)
        }

        // changed: for add mode only
        const participantsMap = new Map()
        if (this.mode === 'add') {
          // changed: if no participants, throw err
          if (inputs.participantsList.length < 1)
            throw new Error('Must specify at least 1 team member')

          // changed: if any participants are null or falsey
          if (inputs.participantsList.some((ele) => !ele.value))
            throw new Error('No empty participant values allowed')
          // changed: map of participant characters by Map<id,obj>
          inputs.participantsList.forEach((ele) => {
            participantsMap.set(ele.value, ele)
          })
          // changed: remove parcipants from inputs and process them specially
          delete inputs.participantsList
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

        // changed: after creating the submission, also add the submissionCharacterParticipantLinks. add mode only
        if (this.mode === 'add') {
          for (const participant of participantsMap) {
            await executeGiraffeql(this, {
              createSubmissionCharacterParticipantLink: {
                __args: {
                  submission: {
                    id: data.id,
                  },
                  character: {
                    id: participant[1].value,
                  },
                  title: participant[1].key,
                },
              },
            })
          }
        }

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

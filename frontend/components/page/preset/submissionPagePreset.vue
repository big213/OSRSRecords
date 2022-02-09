<template>
  <v-container fluid class="text-center" style="max-width: 1920px">
    <v-progress-circular
      v-if="loading.presets"
      indeterminate
    ></v-progress-circular>
    <v-row v-else justify="center" class="pt-3">
      <v-col
        v-for="(crudFilterObject, index) in filterInputsArray"
        :key="index"
        cols="12"
        :lg="crudFilterObject.inputObject.cols || 3"
        class="pb-0"
      >
        <GenericInput
          :item="crudFilterObject.inputObject"
          @change="applyPreset(crudFilterObject.inputObject.fieldKey, $event)"
        ></GenericInput>
      </v-col>
    </v-row>
  </v-container>
</template>

<script>
import { getEventEras } from '~/services/dropdown'
import {
  generateCrudRecordInterfaceRoute,
  getInputObject,
  setInputValue,
  getInputValue,
  populateInputObject,
  isObject,
  handleError,
} from '~/services/base'
import { generateParticipantsOptions } from '~/services/common'
import { Submission } from '~/models/base'
import GenericInput from '~/components/input/genericInput.vue'

export default {
  components: { GenericInput },
  data() {
    return {
      loading: {
        presets: false,
      },
      filterInputsArray: [
        {
          filterObject: {
            field: 'event',
            operator: 'eq',
          },
          inputObject: {
            fieldKey: 'event',
            label: 'Event Category',
            inputType: 'autocomplete',
            value: null,
            inputValue: null,
            clearable: false,
            inputOptions: Submission.fields.event.inputOptions,
            getOptions: Submission.fields.event.getOptions,
            options: [],
            loading: false,
            focused: false,
            generation: 0,
            parentInput: null,
            cols: 4,
            nestedInputsArray: [],
          },
        },
        {
          filterObject: {
            field: 'eventEra',
            operator: 'eq',
          },
          inputObject: {
            fieldKey: 'eventEra',
            label: 'Event Era',
            inputType: 'select',
            value: null,
            inputValue: null,
            clearable: false,
            inputOptions: Submission.fields.eventEra.inputOptions,
            options: [],
            loading: false,
            focused: false,
            generation: 0,
            parentInput: null,
            cols: 3,
            nestedInputsArray: [],
          },
        },
        {
          filterObject: {
            field: 'participants',
            operator: 'eq',
          },
          inputObject: {
            fieldKey: 'participants',
            label: 'Team Size',
            inputType: 'select',
            value: null,
            inputValue: null,
            clearable: false,
            inputOptions: undefined,
            options: [],
            loading: false,
            focused: false,
            generation: 0,
            parentInput: null,
            cols: 2,
            nestedInputsArray: [],
          },
        },
      ],
    }
  },

  props: {
    eventClearable: {
      type: Boolean,
      default: false,
    },
    // will default to participants "any" if it is not specified
    participantsAny: {
      type: Boolean,
      default: false,
    },
    // only show the relevant eras for the eventEra dropdown
    showRelevantEraOnly: {
      type: Boolean,
      default: false,
    },
    // show the "any" option for participants dropdown?
    showParticipantsAny: {
      type: Boolean,
      default: true,
    },
  },
  computed: {
    inputsArray() {
      return this.filterInputsArray.map(
        (crudFilterObject) => crudFilterObject.inputObject
      )
    },
  },

  watch: {
    '$route.query.pageOptions'() {
      this.syncPageOptions()
    },
  },
  mounted() {
    this.reset()
  },
  methods: {
    getInputObject(key) {
      return getInputObject(this.inputsArray, key)
    },

    getInputValue(key) {
      return getInputValue(this.inputsArray, key)
    },

    setInputValue(key, value) {
      return setInputValue(this.inputsArray, key, value)
    },

    // populate the eventEra and participants inputObject (based on the event)
    async handleEventChange() {
      const eventEraInputObject = this.getInputObject('eventEra')
      const participantsInputObject = this.getInputObject('participants')
      const eventInputObject = this.getInputObject('event')

      // if event value is empty and eventClearable = false, set event to first one (with an id)
      if (!eventInputObject.value && !this.eventClearable) {
        eventInputObject.value = eventInputObject.options.find((ele) => ele.id)
      }

      // if event is not specified at this point, set the participants options to "any", eventEras to empty, and skip
      if (!eventInputObject.value) {
        eventEraInputObject.options = []
        eventEraInputObject.value = null
        participantsInputObject.value = '__undefined'
        participantsInputObject.options.push({
          id: '__undefined',
          name: 'Any',
        })

        return
      }

      eventEraInputObject.loading = true
      eventEraInputObject.options = []

      // is isRelevantEraOnly mode, only add that option
      if (this.showRelevantEraOnly) {
        eventEraInputObject.options.push({
          id: '__relevant',
          name: 'Relevant Eras',
        })
      } else {
        // also add an "any" option
        eventEraInputObject.options = await getEventEras(this, false, [
          {
            'event.id': {
              eq: eventInputObject.value.id,
            },
          },
        ]).then((res) =>
          res.concat([
            {
              divider: true,
            },
            {
              id: '__relevant',
              name: 'Relevant Eras',
            },
            {
              id: '__undefined',
              name: 'All Eras',
            },
          ])
        )
      }

      eventEraInputObject.loading = false

      participantsInputObject.options = generateParticipantsOptions(
        eventInputObject.value.minParticipants,
        eventInputObject.value.maxParticipants
      )

      // also add an "any" option
      if (this.showParticipantsAny) {
        participantsInputObject.options.push(
          ...[
            {
              divider: true,
            },
            {
              id: '__undefined',
              name: 'Any',
            },
          ]
        )
      }

      // set to "__relevant" by default if eventEra is null
      if (!eventEraInputObject.value) {
        eventEraInputObject.value = '__relevant'
      }

      // set participants to the first option if it is not an object
      if (!isObject(participantsInputObject.value)) {
        const defaultOption = this.participantsAny
          ? '__undefined'
          : participantsInputObject.options[0]
        // attempt to set to the option with the same id value. else do the first one
        participantsInputObject.value =
          participantsInputObject.options.find(
            (option) =>
              String(option.id) === String(participantsInputObject.value)
          ) ?? defaultOption
      }
    },

    async applyPreset(field, _item) {
      // if setting event, reset options on eventEra and automatically set it to the current one
      const eventEraInputObject = this.getInputObject('eventEra')
      const participantsInputObject = this.getInputObject('participants')
      const eventInputObject = this.getInputObject('event')
      if (field === 'event') {
        this.setBackgroundImage()
        eventEraInputObject.value = null
        await this.handleEventChange()
      }

      // get the original sortBy/sortDesc
      const originalPageOptions = this.$route.query.pageOptions
        ? JSON.parse(atob(decodeURIComponent(this.$route.query.pageOptions)))
        : null
      // replace event filters with new ones
      const excludeFilterKeys = [
        'event',
        'eventEra',
        'participants',
        'eventEra.isRelevant',
        'isSoloPersonalBest',
      ]

      const filters = originalPageOptions?.filters
        ? originalPageOptions.filters.filter(
            (filterObject) => !excludeFilterKeys.includes(filterObject.field)
          )
        : []

      if (eventInputObject.value) {
        filters.push({
          field: 'event',
          operator: 'eq',
          value: isObject(eventInputObject.value)
            ? eventInputObject.value.id
            : eventInputObject.value,
        })
      }

      if (eventEraInputObject.value) {
        const eventEraValue = isObject(eventEraInputObject.value)
          ? eventEraInputObject.value.id
          : eventEraInputObject.value
        if (eventEraValue === '__relevant') {
          filters.push({
            field: 'eventEra.isRelevant',
            operator: 'eq',
            value: true,
          })
        } else {
          filters.push({
            field: 'eventEra',
            operator: 'eq',
            value: eventEraValue,
          })
        }
      }

      if (participantsInputObject.value) {
        const participantsValue = isObject(participantsInputObject.value)
          ? participantsInputObject.value.id
          : participantsInputObject.value

        if (participantsValue === '__solopb') {
          filters.push(
            ...[
              {
                field: 'participants',
                operator: 'eq',
                value: 1,
              },
              {
                field: 'isSoloPersonalBest',
                operator: 'eq',
                value: true,
              },
            ]
          )
        } else {
          filters.push(
            ...[
              {
                field: 'participants',
                operator: 'eq',
                value: isObject(participantsInputObject.value)
                  ? participantsInputObject.value.id
                  : participantsInputObject.value,
              },
              {
                field: 'isSoloPersonalBest',
                operator: 'eq',
                value: '__undefined',
              },
            ]
          )
        }
      }

      this.$router.push(
        generateCrudRecordInterfaceRoute(this.$route.path, {
          ...originalPageOptions,
          filters,
        })
      )
    },

    setBackgroundImage() {
      // emit event update to parent
      this.$root.$emit('setBackgroundImage', {
        url: this.getInputObject('event').value?.backgroundImage ?? null,
      })
    },

    // parses pageOptions and syncs them with the inputs
    syncPageOptions(populateOptions = false) {
      const promisesArray = []
      const pageOptions = this.$route.query.pageOptions
        ? JSON.parse(atob(decodeURIComponent(this.$route.query.pageOptions)))
        : null

      const rawFilters = pageOptions?.filters
      if (rawFilters) {
        // changed: if there is an eventEra.isRelevant filter and it is true, translate this to the "__relevant" option on eventEraInputObject
        if (
          rawFilters.find(
            (rawFilterObject) =>
              rawFilterObject.field === 'eventEra.isRelevant' &&
              rawFilterObject.value === true
          )
        ) {
          this.setInputValue('eventEra', '__relevant')
        }

        // changed: if participants filter === 1 and isSoloPersonalBest filter is true, translate this to "__solopb" option on participantsInputObject
        const soloPbMode =
          rawFilters.find(
            (rawFilterObject) =>
              rawFilterObject.field === 'participants' &&
              rawFilterObject.value === 1
          ) &&
          rawFilters.find(
            (rawFilterObject) =>
              rawFilterObject.field === 'isSoloPersonalBest' &&
              rawFilterObject.value === true
          )

        if (soloPbMode) {
          this.setInputValue('participants', '__solopb')
        }

        // changed: if there is an eventEra filter, set it
        const eventEraFilter = rawFilters.find(
          (rawFilterObject) => rawFilterObject.field === 'eventEra'
        )
        if (eventEraFilter) {
          this.setInputValue('eventEra', eventEraFilter.value)
        }

        const inputFieldsSet = new Set(this.filterInputsArray)
        promisesArray.push(
          ...rawFilters.map((rawFilterObject) => {
            // changed: skip handling of participants if soloPbMode
            if (soloPbMode && rawFilterObject.field === 'participants') return

            const matchingFilterObject = this.filterInputsArray.find(
              (crudFilterObject) =>
                crudFilterObject.filterObject.field === rawFilterObject.field &&
                crudFilterObject.filterObject.operator ===
                  rawFilterObject.operator
            )

            if (matchingFilterObject) {
              matchingFilterObject.inputObject.value = rawFilterObject.value

              // remove from set
              inputFieldsSet.delete(matchingFilterObject)
            }
          })
        )
        // clears any input fields with no filterObject
        promisesArray.push(
          ...this.filterInputsArray.reduce((total, filterObject) => {
            // filterObject.inputObject.value = null

            // changed: if field is eventEra, don't run this, as we are already populating earlier in this fn, and we don't want to trigger stuff in populateInputObject
            if (filterObject.inputObject.fieldKey === 'eventEra') {
              return total
            }

            // also runs populateInputObject on these (in case we need to populate options)
            return total.concat(
              populateInputObject(
                this,
                filterObject.inputObject,
                populateOptions
              )
            )
          }, [])
        )
      }

      return promisesArray
    },

    async reset() {
      this.loading.presets = true
      try {
        if (this.eventClearable) {
          this.getInputObject('event').clearable = true
        }
        // syncs the page options while populating the inputObject.options
        await Promise.all(this.syncPageOptions(true))
        await this.handleEventChange()
        this.setBackgroundImage()
      } catch (err) {
        handleError(this, err)
      }

      this.loading.presets = false
    },
  },
}
</script>

<style scoped>
.inputs-bg {
  background-color: var(--v-accent-base);
}
</style>

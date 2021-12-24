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
        lg="3"
        class="pb-0 inputs-bg"
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
} from '~/services/base'
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
            inputOptions: Submission.fields['event'].inputOptions,
            getOptions: Submission.fields['event'].getOptions,
            options: [],
            loading: false,
            focused: false,
            generation: 0,
            parentInput: null,
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
            inputOptions: Submission.fields['eventEra'].inputOptions,
            options: [],
            loading: false,
            focused: false,
            generation: 0,
            parentInput: null,
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
            options: [
              {
                name: 'Solo',
                id: 1,
              },
              {
                name: 'Duo',
                id: 2,
              },

              {
                name: 'Trio',
                id: 3,
              },

              {
                name: '4-Man',
                id: 4,
              },

              {
                name: '5-Man',
                id: 5,
              },
            ],
            loading: false,
            focused: false,
            generation: 0,
            parentInput: null,
            nestedInputsArray: [],
          },
        },
      ],
    }
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

    // populate the eventEra inputObject (based on the event)
    async populateEventEra() {
      const eventEraInputObject = this.getInputObject('eventEra')
      const eventValue = this.getInputValue('event')

      eventEraInputObject.options = []
      eventEraInputObject.options = await getEventEras(this, false, [
        {
          'event.id': {
            eq: isObject(eventValue) ? eventValue.id : eventValue,
          },
        },
      ])

      // set to current era by default if eventEra is null
      if (!eventEraInputObject.value) {
        eventEraInputObject.value = eventEraInputObject.options.find(
          (ele) => ele.isCurrent
        )
      }
    },

    async applyPreset(field, item) {
      // if setting event, reset options on eventEra and automatically set it to the current one
      const eventEraInputObject = this.getInputObject('eventEra')
      if (field === 'event') {
        this.setBackgroundImage()
        eventEraInputObject.value = null
        await this.populateEventEra()
      }

      // get the original sortBy/sortDesc
      const originalPageOptions = this.$route.query.pageOptions
        ? JSON.parse(atob(decodeURIComponent(this.$route.query.pageOptions)))
        : null
      // replace event filters with new ones
      const excludeFilterKeys = [field, 'eventEra']
      this.$router.push(
        generateCrudRecordInterfaceRoute(this.$route.path, {
          ...originalPageOptions,
          filters: (originalPageOptions?.filters
            ? originalPageOptions.filters.filter(
                (filterObject) =>
                  !excludeFilterKeys.includes(filterObject.field)
              )
            : []
          ).concat(
            item
              ? [
                  {
                    field: field,
                    operator: 'eq',
                    value: item.id,
                  },
                  {
                    field: 'eventEra',
                    operator: 'eq',
                    value: isObject(eventEraInputObject.value)
                      ? eventEraInputObject.value.id
                      : eventEraInputObject.value,
                  },
                ]
              : []
          ),
        })
      )
    },

    // syncs preset inputs with filters
    syncFilters() {
      const originalPageOptions = this.$route.query.pageOptions
        ? JSON.parse(atob(decodeURIComponent(this.$route.query.pageOptions)))
        : null
      // determine if a preset was applied
      if (originalPageOptions.filters) {
        // sync era filters
        const eventEraFilterObject = originalPageOptions.filters.find(
          (filterObject) => filterObject.field === 'eventEra'
        )

        if (eventEraFilterObject) {
          // special: only setting the original eventEra.id value
          this.setInputValue('eventEra', eventEraFilterObject.value)
        } else {
          this.setInputValue('eventEra', null)
        }

        // sync event filters
        const eventFilterObject = originalPageOptions.filters.find(
          (filterObject) => filterObject.field === 'event'
        )

        if (eventFilterObject) {
          // special: doing this to force the event watcher change
          this.setInputValue('event', null)

          this.setInputValue(
            'event',
            this.getInputObject('event').options.find(
              (event) => event.id === eventFilterObject.value
            )
          )
        } else {
          this.setInputValue('event', null)
        }

        // sync participants filters
        const participantsFilterObject = originalPageOptions.filters.find(
          (filterObject) => filterObject.field === 'participants'
        )
        if (participantsFilterObject) {
          this.setInputValue(
            'participants',
            this.getInputObject('participants').options.find(
              (participantObject) =>
                participantObject.id === participantsFilterObject.value
            )
          )
        } else {
          this.setInputValue('participants', null)
        }
      }
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
        const inputFieldsSet = new Set(this.filterInputsArray)
        promisesArray.push(
          ...rawFilters.map(async (rawFilterObject) => {
            const matchingFilterObject = this.filterInputsArray.find(
              (crudFilterObject) =>
                crudFilterObject.filterObject.field === rawFilterObject.field &&
                crudFilterObject.filterObject.operator ===
                  rawFilterObject.operator
            )

            if (matchingFilterObject) {
              matchingFilterObject.inputObject.value = rawFilterObject.value

              // populate inputObjects if we need to translate any IDs to objects. Do NOT populate the options
              await populateInputObject(
                this,
                matchingFilterObject.inputObject,
                populateOptions
              )

              // remove from set
              inputFieldsSet.delete(matchingFilterObject)
            }
          })
        )
        // clears any input fields with no filterObject
        inputFieldsSet.forEach((ele) => (ele.value = null))
      }

      return promisesArray
    },

    async reset() {
      this.loading.presets = true
      // syncs the page options while populating the inputObject.options
      await this.syncPageOptions(true)
      await this.populateEventEra()
      this.setBackgroundImage()
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

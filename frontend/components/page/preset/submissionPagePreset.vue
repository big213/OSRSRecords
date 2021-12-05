<template>
  <v-container fluid class="text-center" style="max-width: 1920px">
    <v-progress-circular
      v-if="loading.presets"
      indeterminate
    ></v-progress-circular>
    <v-row v-else justify="center" class="pt-3">
      <v-col
        v-for="(inputObject, index) in inputsArray"
        :key="index"
        cols="12"
        lg="3"
        class="pb-0 inputs-bg"
      >
        <GenericInput
          :item="inputObject"
          @change="applyPreset(inputObject.field, $event)"
        ></GenericInput>
      </v-col>
    </v-row>
  </v-container>
</template>

<script>
import { getEventsByGroup, getEras } from '~/services/dropdown'
import {
  generateCrudRecordInterfaceRoute,
  getIcon,
  getInputObject,
  setInputValue,
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
      inputsArray: [
        {
          field: 'era',
          label: 'Era',
          inputType: 'select',
          value: null,
          clearable: false,
          inputOptions: Submission.fields['era'].inputOptions,
        },
        {
          field: 'event',
          label: 'Event Category',
          inputType: 'autocomplete',
          value: null,
          clearable: false,
          inputOptions: Submission.fields['event'].inputOptions,
        },
        {
          field: 'participants',
          label: 'Team Size',
          inputType: 'select',
          value: null,
          clearable: true,
          inputOptions: 'select',
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
        },
      ],
    }
  },
  watch: {
    '$route.query.pageOptions'() {
      this.syncFilters()
    },
  },
  mounted() {
    this.loadPresets().then(() => {
      this.syncFilters()
    })
  },
  methods: {
    getIcon,
    getInputObject(key) {
      return getInputObject(this.inputsArray, key)
    },

    setInputValue(key, value) {
      return setInputValue(this.inputsArray, key, value)
    },

    applyPreset(field, item) {
      // get the original sortBy/sortDesc
      const originalPageOptions = this.$route.query.pageOptions
        ? JSON.parse(atob(decodeURIComponent(this.$route.query.pageOptions)))
        : null
      // replace event filters with new ones
      const excludeFilterKeys = [field]
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
                ]
              : []
          ),
        })
      )
    },

    async loadPresets() {
      this.loading.presets = true
      this.getInputObject('event').options = await getEventsByGroup(this)
      this.getInputObject('era').options = await getEras(this)
      this.loading.presets = false
    },
    // syncs preset inputs with filters
    syncFilters() {
      const originalPageOptions = this.$route.query.pageOptions
        ? JSON.parse(atob(decodeURIComponent(this.$route.query.pageOptions)))
        : null
      // determine if a preset was applied
      if (originalPageOptions.filters) {
        // sync era filters
        const eraFilterObject = originalPageOptions.filters.find(
          (filterObject) => filterObject.field === 'era'
        )
        if (eraFilterObject) {
          this.setInputValue(
            'era',
            this.getInputObject('era').options.find(
              (era) => era.id === eraFilterObject.value
            )
          )
        } else {
          this.setInputValue('era', null)
        }

        // sync event filters
        const eventFilterObject = originalPageOptions.filters.find(
          (filterObject) => filterObject.field === 'event'
        )
        if (eventFilterObject) {
          this.setInputValue(
            'event',
            this.getInputObject('event').options.find(
              (event) => event.id === eventFilterObject.value
            )
          )
        } else {
          this.setInputValue('event', null)
        }

        // emit event update to parent
        this.$root.$emit('setBackgroundImage', {
          url: this.getInputObject('event').value?.backgroundImage ?? null,
        })

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
  },
}
</script>

<style scoped>
.inputs-bg {
  background-color: var(--v-accent-base);
}
</style>

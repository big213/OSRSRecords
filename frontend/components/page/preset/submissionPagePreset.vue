<template>
  <v-container fluid class="text-center pb-0" style="max-width: 1920px">
    <v-progress-circular
      v-if="loading.presets"
      indeterminate
    ></v-progress-circular>
    <v-row v-else justify="center" class="pt-3">
      <v-col :key="-1" cols="12" lg="3" class="pb-0">
        <v-autocomplete
          v-model="inputs.event"
          :items="events"
          item-text="name"
          item-value="id"
          label="Event"
          filled
          return-object
          :clearable="eventClearable"
          @change="applyEventPreset"
        ></v-autocomplete>
      </v-col>
      <v-col :key="-2" cols="12" lg="3" class="pb-0">
        <v-select
          v-model="inputs.participants"
          :items="participants"
          item-text="text"
          label="Participants"
          clearable
          filled
          return-object
          @change="applyParticipantsPreset"
        ></v-select>
      </v-col>
    </v-row>
  </v-container>
</template>

<script>
import { getEvents } from '~/services/dropdown'
import { generateCrudRecordInterfaceRoute } from '~/services/base'
export default {
  props: {
    eventClearable: {
      type: Boolean,
      default: true,
    },
  },
  data() {
    return {
      inputs: {
        event: null,
        participants: null,
      },
      loading: {
        presets: false,
      },
      events: [],
      participants: [
        {
          text: 'Solo',
          value: 1,
        },
        {
          text: 'Duo',
          value: 2,
        },

        {
          text: 'Trio',
          value: 3,
        },

        {
          text: '4-Man',
          value: 4,
        },

        {
          text: '5-Man',
          value: 5,
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
    applyEventPreset(event) {
      // get the original sortBy/sortDesc
      const originalPageOptions = this.$route.query.pageOptions
        ? JSON.parse(atob(decodeURIComponent(this.$route.query.pageOptions)))
        : null
      // replace event.id filters with new ones
      const excludeFilterKeys = ['event.id']
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
            event
              ? [
                  {
                    field: 'event.id',
                    operator: 'eq',
                    value: event.id,
                  },
                ]
              : []
          ),
        })
      )
    },
    applyParticipantsPreset(participantObject) {
      // get the original sortBy/sortDesc/filters
      const originalPageOptions = this.$route.query.pageOptions
        ? JSON.parse(atob(decodeURIComponent(this.$route.query.pageOptions)))
        : null
      // replace event.id/setSize filters with new ones
      const excludeFilterKeys = ['participants']
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
            participantObject
              ? [
                  {
                    field: 'participants',
                    operator: 'eq',
                    value: participantObject.value,
                  },
                ]
              : []
          ),
        })
      )
    },
    async loadPresets() {
      this.loading.presets = true
      this.events = await getEvents(this)
      this.loading.presets = false
    },
    // syncs preset inputs with filters
    syncFilters() {
      const originalPageOptions = this.$route.query.pageOptions
        ? JSON.parse(atob(decodeURIComponent(this.$route.query.pageOptions)))
        : null
      // determine if a preset was applied
      if (originalPageOptions.filters) {
        const eventFilterObject = originalPageOptions.filters.find(
          (filterObject) => filterObject.field === 'event.id'
        )
        if (eventFilterObject) {
          this.inputs.event = this.events.find(
            (event) => event.id === eventFilterObject.value
          )
        } else {
          this.inputs.event = null
        }
        const participantsFilterObject = originalPageOptions.filters.find(
          (filterObject) => filterObject.field === 'participants'
        )
        if (participantsFilterObject) {
          this.inputs.participants = this.participants.find(
            (participantObject) =>
              participantObject.value === participantsFilterObject.value
          )
        } else {
          this.inputs.participants = null
        }
      }
    },
  },
}
</script>

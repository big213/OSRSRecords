<template>
  <div v-if="$route.query.pageOptions">
    <SubmissionPagePreset
      :event-clearable="false"
      show-relevant-era-only
      :show-participants-any="false"
    ></SubmissionPagePreset>
    <CrudRecordPage
      :record-info="recordInfo"
      :locked-filters="lockedFilters"
      :hidden-filters="hiddenFilters"
      :head="head"
      :title="title"
      icon="mdi-star"
    ></CrudRecordPage>
  </div>
  <v-container v-else fluid fill-height justify-center>
    <v-progress-circular indeterminate></v-progress-circular>
  </v-container>
</template>

<script>
import { generateLeaderboardPageOptions } from '~/services/common'
import { generateCrudRecordInterfaceRoute } from '~/services/base'
import SubmissionPagePreset from '~/components/page/preset/submissionPagePreset.vue'
import CrudRecordPage from '~/components/page/crudRecordPage.vue'
import { PublicSubmission } from '~/models/public'

export default {
  components: {
    CrudRecordPage,
    SubmissionPagePreset,
  },

  data() {
    return {
      recordInfo: {
        ...PublicSubmission,
        paginationOptions: {
          ...PublicSubmission.paginationOptions,
          sortOptions: [
            {
              field: 'happenedOn',
              desc: true,
            },
          ],
        },
      },
      hiddenFilters: ['status'],
      head: {
        title: 'Record Progression',
      },
      lockedFilters: [
        {
          field: 'status',
          operator: 'eq',
          value: 'APPROVED',
        },
        {
          field: 'isRelevantRecord',
          operator: 'eq',
          value: true,
        },
      ],
      title: 'Record Progression',
    }
  },

  computed: {
    currentParams() {
      return {
        eventId: this.$route.query.eventId,
        eventEraId: this.$route.query.eventEraId,
        eventEraMode: this.$route.query.eventEraMode ?? 'RELEVANT_ERAS',
        participants: this.$route.query.participants,
        isSoloPersonalBest:
          this.$route.query.isSoloPersonalBest !== undefined
            ? this.$route.query.isSoloPersonalBest === 'true'
            : undefined,
      }
    },
  },

  watch: {
    '$route.query.pageOptions'(val) {
      // if no pageOptions, automatically redirect
      if (!val) {
        generateLeaderboardPageOptions(this, this.currentParams)
          .then((pageOptions) => {
            this.$router.push(
              generateCrudRecordInterfaceRoute(this.$route.path, {
                ...pageOptions,
                sort: {
                  field: 'happenedOn',
                  desc: true,
                },
              })
            )
          })
          .catch((e) => e)
      }
    },
  },

  mounted() {
    // if no pageOptions, automatically redirect
    if (!this.$route.query.pageOptions) {
      generateLeaderboardPageOptions(this, this.currentParams)
        .then((pageOptions) => {
          this.$router.push(
            generateCrudRecordInterfaceRoute(this.$route.path, {
              ...pageOptions,
              sort: {
                field: 'happenedOn',
                desc: true,
              },
            })
          )
        })
        .catch((e) => e)
    }
  },
}
</script>

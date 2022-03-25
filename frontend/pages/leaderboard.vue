<template>
  <div v-if="$route.query.pageOptions">
    <SubmissionPagePreset :event-clearable="false"></SubmissionPagePreset>
    <CrudRecordPage
      :record-info="recordInfo"
      :locked-filters="lockedFilters"
      :hidden-filters="hiddenFilters"
      icon="mdi-podium"
    ></CrudRecordPage>
  </div>
  <v-container v-else fluid fill-height justify-center>
    <v-progress-circular indeterminate></v-progress-circular>
  </v-container>
</template>

<script>
import { generateLeaderboardRoute } from '~/services/common'
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
        title: 'Leaderboard',
        fields: {
          ...PublicSubmission.fields,
          relevantEraRanking: {
            ...PublicSubmission.fields.relevantEraRanking,
            text: 'Ranking',
          },
        },
        paginationOptions: {
          ...PublicSubmission.paginationOptions,
          sortOptions: [
            {
              field: 'score',
              desc: false,
            },
            {
              field: 'score',
              desc: true,
            },
          ],
        },
      },
      hiddenFilters: ['status'],
      lockedFilters: [
        {
          field: 'status',
          operator: 'eq',
          value: 'APPROVED',
        },
      ],
      loading: {
        redirect: false,
      },
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
        generateLeaderboardRoute(this, this.currentParams)
          .then((route) => {
            this.$router.push(route)
          })
          .catch((e) => e)
      }
    },
  },

  mounted() {
    // if no pageOptions, automatically redirect
    if (!this.$route.query.pageOptions) {
      generateLeaderboardRoute(this, this.currentParams)
        .then((route) => {
          this.$router.push(route)
        })
        .catch((e) => e)
    }
  },
}
</script>

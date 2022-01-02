<template>
  <div v-if="$route.query.pageOptions">
    <SubmissionPagePreset :event-clearable="false"></SubmissionPagePreset>
    <CrudRecordPage
      :record-info="recordInfo"
      :locked-filters="lockedFilters"
      :hidden-filters="hiddenFilters"
      :head="head"
      :title="title"
      icon="mdi-podium"
    ></CrudRecordPage>
  </div>
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
        fields: {
          ...PublicSubmission.fields,
          ranking: {
            ...PublicSubmission.fields.ranking,
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
      head: {
        title: 'Leaderboard',
      },
      lockedFilters: [
        {
          field: 'status',
          operator: 'eq',
          value: 'APPROVED',
        },
      ],
      title: 'Leaderboard',
    }
  },

  watch: {
    '$route.query.pageOptions'(val) {
      // if no pageOptions, automatically redirect
      if (!val) {
        generateLeaderboardRoute(this)
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
      generateLeaderboardRoute(this)
        .then((route) => {
          this.$router.push(route)
        })
        .catch((e) => e)
    }
  },
}
</script>

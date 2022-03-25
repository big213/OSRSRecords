<template>
  <div v-if="$route.query.pageOptions">
    <SubmissionPagePreset
      event-clearable
      participants-any
    ></SubmissionPagePreset>
    <CrudRecordPage
      :record-info="recordInfo"
      :locked-filters="lockedFilters"
      :hidden-filters="hiddenFilters"
      icon="mdi-star"
    ></CrudRecordPage>
  </div>
  <v-container v-else fluid fill-height justify-center>
    <v-progress-circular indeterminate></v-progress-circular>
  </v-container>
</template>

<script>
import { generateCrudRecordRoute } from '~/services/base'
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
        title: 'Latest Submissions',
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
      lockedFilters: [
        {
          field: 'status',
          operator: 'eq',
          value: 'APPROVED',
        },
      ],
    }
  },

  computed: {
    defaultRoute() {
      return generateCrudRecordRoute(this, {
        path: this.$route.path,
        pageOptions: {
          search: '',
          filters: [],
          sort: {
            field: 'happenedOn',
            desc: true,
          },
        },
      })
    },
  },

  watch: {
    '$route.query.pageOptions'(val) {
      // if no pageOptions, automatically redirect
      if (!val) {
        this.$router.push(this.defaultRoute)
      }
    },
  },

  mounted() {
    // if no pageOptions, automatically redirect
    if (!this.$route.query.pageOptions) {
      this.$router.push(this.defaultRoute)
    }
  },
}
</script>

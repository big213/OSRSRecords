<template>
  <div v-if="$route.query.pageOptions">
    <SubmissionPagePreset event-clearable></SubmissionPagePreset>
    <CrudRecordPage
      :record-info="recordInfo"
      :locked-filters="lockedFilters"
      :hidden-filters="hiddenFilters"
      :head="head"
      :title="title"
      icon="mdi-star"
    ></CrudRecordPage>
  </div>
</template>

<script>
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
        title: 'Public Submissions',
      },
      lockedFilters: [
        {
          field: 'status',
          operator: 'eq',
          value: 'APPROVED',
        },
      ],
      title: 'Public Submissions',
    }
  },

  computed: {
    targetRoute() {
      return generateCrudRecordInterfaceRoute(this.$route.path, {
        search: null,
        filters: [],
        sort: {
          field: 'happenedOn',
          desc: true,
        },
      })
    },
  },

  watch: {
    '$route.query.pageOptions'(val) {
      // if no pageOptions, automatically redirect
      if (!val) {
        this.$router.push(this.targetRoute)
      }
    },
  },

  mounted() {
    // if no pageOptions, automatically redirect
    if (!this.$route.query.pageOptions) {
      this.$router.push(this.targetRoute)
    }
  },
}
</script>

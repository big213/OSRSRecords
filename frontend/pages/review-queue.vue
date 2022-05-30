<template>
  <div v-if="$route.query.pageOptions">
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
import CrudRecordPage from '~/components/page/crudRecordPage.vue'
import { Submission } from '~/models/base'

export default {
  components: {
    CrudRecordPage,
  },

  data() {
    return {
      recordInfo: Submission,
    }
  },

  computed: {
    defaultRoute() {
      return generateCrudRecordRoute(this, {
        path: this.$route.path,
        pageOptions: {
          search: '',
          filters: [
            {
              field: 'status',
              operator: 'in',
              value: ['UNDER_REVIEW', 'SUBMITTED', 'INFORMATION_REQUESTED'],
            },
          ],
          sort: {
            field: 'createdAt',
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

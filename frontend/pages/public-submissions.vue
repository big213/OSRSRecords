<template>
  <div>
    <SubmissionPagePreset :event-clearable="false"></SubmissionPagePreset>
    <CrudRecordPage
      :record-info="recordInfo"
      :locked-filters="lockedFilters"
      :head="head"
      :title="title"
      icon="mdi-star"
    ></CrudRecordPage>
  </div>
</template>

<script>
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
      recordInfo: PublicSubmission,
      head: {
        title: 'Public Submissions',
      },
      lockedFilters: [],
      title: 'Public Submissions',

      loading: {
        presets: false,
      },
    }
  },
}
</script>

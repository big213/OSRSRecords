<template>
  <div>
    <CrudRecordPage
      :record-info="recordInfo"
      :head="head"
      :title="title"
      icon="mdi-star"
    ></CrudRecordPage>
  </div>
</template>

<script>
import CrudRecordPage from '~/components/page/crudRecordPage.vue'
import { Submission } from '~/models/base'

export default {
  components: {
    CrudRecordPage,
  },

  data() {
    return {
      recordInfo: Submission,
      head: {
        title: 'Submissions',
      },
      title: 'Submissions',
    }
  },
}
</script>

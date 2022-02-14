<template>
  <div>
    <CrudRecordPage
      :record-info="recordInfo"
      :head="head"
      :title="title"
      icon="mdi-account"
    ></CrudRecordPage>
  </div>
</template>

<script>
import CrudRecordPage from '~/components/page/crudRecordPage.vue'
import { Character } from '~/models/base'

export default {
  components: {
    CrudRecordPage,
  },

  data() {
    return {
      recordInfo: Character,
      head: {
        title: 'Manage Characters',
      },
      title: 'Manage Characters',
    }
  },
}
</script>

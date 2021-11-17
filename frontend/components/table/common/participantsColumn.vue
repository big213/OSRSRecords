<template>
  <div v-if="currentValue">
    <div v-for="(participantLink, index) in currentValue" :key="index">
      <span v-if="participantLink.title">{{ participantLink.title }}:</span>
      <PreviewRecordMenu
        :item="participantLink.character"
        :close-on-content-click="false"
        :min-width="300"
        :max-width="300"
        offset-y
        top
      ></PreviewRecordMenu>
    </div>
  </div>
</template>

<script>
import columnMixin from '~/mixins/column'
import PreviewRecordMenu from '~/components/menu/previewRecordMenu.vue'

export default {
  components: {
    PreviewRecordMenu,
  },

  mixins: [columnMixin],
}
</script>

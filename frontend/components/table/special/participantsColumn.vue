<template>
  <div v-if="currentValue">
    <div class="pb-2">({{ currentValue.length }})</div>
    <div
      v-for="(participantLink, index) in currentValue"
      :key="index"
      class="pb-2"
    >
      <PreviewRecordMenu
        :item="participantLink.character"
        :close-on-content-click="false"
        :min-width="300"
        :max-width="300"
        offset-y
        top
        open-mode="openInDialog"
      ></PreviewRecordMenu>
      <span v-if="participantLink.title">({{ participantLink.title }})</span>
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

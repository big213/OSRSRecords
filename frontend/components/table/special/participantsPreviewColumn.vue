<template>
  <div v-if="currentValue">
    <span class="pr-1">({{ currentValue.length }})</span>
    <span
      v-for="(participantLink, index) in currentValue"
      class="pr-2"
      :key="index"
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
    </span>
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

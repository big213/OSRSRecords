<template>
  <div v-if="currentValue">
    <PreviewRecordMenu
      :item="computedEvent"
      :close-on-content-click="false"
      :min-width="300"
      :max-width="300"
      offset-y
      top
      open-mode="openInDialog"
    ></PreviewRecordMenu>
  </div>
</template>

<script>
import columnMixin from '~/mixins/column'
import PreviewRecordMenu from '~/components/menu/previewRecordMenu.vue'
import { generateEventText } from '~/services/common'

export default {
  components: {
    PreviewRecordMenu,
  },

  mixins: [columnMixin],

  computed: {
    computedEvent() {
      return {
        ...this.currentValue.event,
        name: generateEventText(
          this.currentValue.event.name,
          this.currentValue.participants,
          this.currentValue.event.maxParticipants
        ),
      }
    },
  },
}
</script>

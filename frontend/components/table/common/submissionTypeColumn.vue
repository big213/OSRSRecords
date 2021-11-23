<template>
  <div v-if="currentValue">
    <PreviewRecordMenu
      :item="computedEvent"
      :close-on-content-click="false"
      :min-width="300"
      :max-width="300"
      offset-y
      top
    ></PreviewRecordMenu>
  </div>
</template>

<script>
import columnMixin from '~/mixins/column'
import PreviewRecordMenu from '~/components/menu/previewRecordMenu.vue'
import { participantsTextMap } from '~/services/constants'

export default {
  components: {
    PreviewRecordMenu,
  },

  mixins: [columnMixin],

  computed: {
    computedEvent() {
      return {
        ...this.currentValue.event,
        name: `${this.currentValue.event.name} (${
          participantsTextMap[this.currentValue.participants] ??
          this.currentValue.participants + '-Man'
        })`,
      }
    },
  },
}
</script>

<template>
  <div v-if="currentValue">
    {{ renderedResult }}
  </div>
</template>

<script>
import columnMixin from '~/mixins/column'
import { participantsTextMap } from '~/services/constants'
export default {
  mixins: [columnMixin],
  computed: {
    renderedResult() {
      return `${this.currentValue.event.name} (${
        participantsTextMap[this.currentValue.participants] ??
        this.currentValue.participants + '-Man'
      })`
    },
  },
}
</script>

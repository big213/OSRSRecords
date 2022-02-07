<template>
  <div>
    {{ displayString }}
  </div>
</template>

<script>
import columnMixin from '~/mixins/column'
import { daysDiff } from '~/services/common'

export default {
  mixins: [columnMixin],

  computed: {
    displayString() {
      if (!this.currentValue.isRelevantRecord) return 'N/A'

      if (!this.currentValue.supersedingRecord) {
        return `${daysDiff(
          this.currentValue.happenedOn,
          new Date().getTime() / 1000
        )}+ days`
      }

      const dateDiff = daysDiff(
        this.currentValue.happenedOn,
        this.currentValue.supersedingRecord.happenedOn
      )

      return `${dateDiff ? dateDiff : `<1`} days`
    },
  },
}
</script>

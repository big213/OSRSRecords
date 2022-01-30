<template>
  <div>
    <SubmissionStatusChip
      :indexOrName="currentValue"
      small
      v-bind="attrs"
      v-on="on"
    ></SubmissionStatusChip>
  </div>
</template>

<script>
import columnMixin from '~/mixins/column'
import SubmissionStatusChip from '~/components/chip/submissionStatusChip.vue'

export default {
  mixins: [columnMixin],
  components: {
    SubmissionStatusChip,
  },
}
</script>

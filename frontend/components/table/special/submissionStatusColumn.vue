<template>
  <div>
    <v-menu offset-x right>
      <template v-slot:activator="{ on, attrs }">
        <SubmissionStatusChip
          :indexOrName="currentValue"
          small
          v-bind="attrs"
          v-on="on"
        ></SubmissionStatusChip>
      </template>
      <v-list dense>
        <v-list-item
          v-for="(item, index) in pbStatuses"
          :key="index"
          :class="{ 'selected-bg': currentValue === item }"
          @click="updateSubmissionStatus(item)"
        >
          <SubmissionStatusChip
            small
            :indexOrName="item"
            class="pointer-cursor"
          ></SubmissionStatusChip>
        </v-list-item>
      </v-list>
    </v-menu>
    <v-progress-circular
      v-if="loading.submit"
      indeterminate
      size="16"
    ></v-progress-circular>
  </div>
</template>

<script>
import { executeGiraffeql } from '~/services/giraffeql'
import { handleError } from '~/services/base'
import columnMixin from '~/mixins/column'
import { getSubmissionStatuses } from '~/services/dropdown'
import SubmissionStatusChip from '~/components/chip/submissionStatusChip.vue'

export default {
  mixins: [columnMixin],
  components: {
    SubmissionStatusChip,
  },

  data() {
    return {
      pbStatuses: [],
      loading: {
        submit: false,
      },
    }
  },

  created() {
    getSubmissionStatuses(this).then((res) => (this.pbStatuses = res))
  },

  methods: {
    async updateSubmissionStatus(status) {
      this.loading.submit = true
      try {
        await executeGiraffeql(this, {
          updateSubmission: {
            __args: {
              fields: {
                status,
              },
              item: {
                id: this.item.id,
              },
            },
          },
        })

        // this.$emit('submit')
        this.$emit('item-updated')

        // refresh any submission interfaces
        this.$root.$emit('refresh-interface', 'submission')

        this.$notifier.showSnackbar({
          message: `Submission Status updated`,
          variant: 'success',
        })
      } catch (err) {
        handleError(this, err)
      }
      this.loading.submit = false
    },
  },
}
</script>
<style>
.selected-bg {
  background-color: var(--v-primary-base);
}

.pointer-cursor {
  cursor: pointer;
}
</style>

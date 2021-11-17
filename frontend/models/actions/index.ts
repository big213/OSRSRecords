import { handleError } from '~/services/base'

export const createTaskFromTemplate = async (that, item) => {
  try {
    if (!that.$store.getters['auth/user']) {
      throw new Error('Login required')
    }

    that.$root.$emit('openEditRecordDialog', {
      recordInfo: 'GlobalTasks',
      mode: 'add',
      selectedItem: {
        'sender.id': that.$store.getters['auth/user']?.id,
        ...(that.$store.getters['workspace/workspace'] && {
          'workspace.id': that.$store.getters['workspace/workspace'].id,
        }),
        'taskTemplate.id': item.id,
      },
    })
  } catch (err) {
    handleError(that, err)
  }
}

export const selectWorkspace = (that, item) => {
  that.$store.commit('auth/setWorkspace', item)

  that.$notifier.showSnackbar({
    message: `Workspace Selected: ${item.name}`,
    variant: 'success',
  })
}

import { Submission } from '../base'
import EditSubmissionInterface from '~/components/interface/crud/special/editSubmissionInterface.vue'

export const MySubmission = {
  ...Submission,
  addOptions: {
    fields: [
      'event',
      'eventEra',
      'participantsList',
      'timeElapsed',
      'externalLinks',
      'happenedOn',
      'world',
      // 'files',
      'privateComments',
      'publicComments',
      // 'status',
    ],
    component: EditSubmissionInterface,
  },
}

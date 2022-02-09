import { Submission } from '../base'

export const PublicSubmission = {
  ...Submission,
  routeName: 'i-view',
  fields: {
    ...Submission.fields,
  },
  paginationOptions: {
    ...Submission.paginationOptions,
    headerOptions: [
      {
        field: 'relevantEraRanking',
        width: '100px',
        align: 'right',
      },
      {
        field: 'eventEraRecord',
        width: '150px',
        hideIf: (that) => {
          // hide this column if the eventEra raw filter is specified and it is not '__undefined'
          const eventEraFilter = that.allFilters.find(
            (rawFilterObject) => rawFilterObject.field === 'eventEra'
          )
          return eventEraFilter && eventEraFilter.value !== '__undefined'
        },
      },
      {
        field: 'eventRecordWithParticipants',
        width: '250px',
        hideIf: (that) => {
          // hide this column if the event raw filter is specified and it is not '__undefined'
          const eventFilter = that.allFilters.find(
            (rawFilterObject) => rawFilterObject.field === 'event'
          )
          return eventFilter && eventFilter.value !== '__undefined'
        },
      },
      {
        field: 'participantsLinksList',
      },
      {
        field: 'score',
        width: '100px',
        align: 'right',
      },
      {
        field: 'mainEvidenceLinks',
        width: '50px',
      },
      {
        field: 'happenedOn',
        width: '120px',
      },
    ],
    downloadOptions: undefined,
  },

  viewOptions: {
    fields: [
      'eventRecordWithParticipants',
      'eventEraRecord',
      'participantsLinksListDetail',
      'score',
      'happenedOn',
      'statusReadonly',
      // 'isRecordingVerified',
      'world',
      'relevantEraRanking',
      'daysRecordStood',
      // 'supersedingRecordHappenedOn',
      // 'previousRecordHappenedOn',
      // 'files',
      'externalLinks',
      //'privateComments',
      'publicComments',
    ],
  },
  addOptions: undefined,
  editOptions: undefined,
  deleteOptions: undefined,
}

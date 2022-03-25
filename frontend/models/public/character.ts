import { Character } from '../base'
import { PublicSubmission } from './submission'

export const PublicCharacter = {
  ...Character,
  paginationOptions: {
    ...Character.paginationOptions,
    downloadOptions: undefined,
  },
  addOptions: undefined,
  editOptions: undefined,
  deleteOptions: undefined,
  enterOptions: {
    routeType: 'i',
  },
  expandTypes: [
    {
      recordInfo: {
        ...PublicSubmission,
        paginationOptions: {
          ...PublicSubmission.paginationOptions,
          headerOptions: [
            {
              field: 'relevantEraRanking',
              width: '100px',
              align: 'right',
            },
            {
              field: 'eventRecordWithParticipants',
              width: '250px',
            },
            {
              field: 'eventEraRecord',
              width: '250px',
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
              width: '150px',
            },
          ],
          downloadOptions: undefined,
        },
      },
      name: 'Approved Submissions',
      lockedFilters: (_that, item) => {
        return [
          {
            field: 'submissionCharacterParticipantLink/character',
            operator: 'eq',
            value: item.id,
          },
          {
            field: 'status',
            operator: 'eq',
            value: 'APPROVED',
          },
        ]
      },
      initialSortOptions: {
        field: 'happenedOn',
        desc: true,
      },
    },
  ],
}

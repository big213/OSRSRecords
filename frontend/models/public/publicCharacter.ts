import { PublicSubmission } from './publicSubmission'
import { Character } from '../base'
export const PublicCharacter = {
  ...Character,
  addOptions: undefined,
  editOptions: undefined,
  deleteOptions: undefined,
  expandTypes: [
    {
      recordInfo: {
        ...PublicSubmission,
        paginationOptions: {
          ...PublicSubmission.paginationOptions,
          headers: [
            {
              field: 'ranking',
              sortable: false,
              width: '100px',
            },
            {
              field: 'eventRecordWithParticipants',
              sortable: false,
              width: '250px',
            },
            {
              field: 'eraRecord',
              sortable: false,
              width: '250px',
            },
            {
              field: 'participantsListFlat',
              sortable: false,
            },
            {
              field: 'score',
              width: '200px',
              sortable: true,
              align: 'right',
            },
            {
              field: 'mainExternalLink',
              sortable: false,
              width: '150px',
            },
            {
              field: 'happenedOn',
              width: '150px',
              sortable: true,
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
        sortBy: ['happenedOn'],
        sortDesc: [true],
      },
    },
  ],
}

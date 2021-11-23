import type { RecordInfo } from '~/types'
import TimeagoColumn from '~/components/table/common/timeagoColumn.vue'
import PreviewableFilesColumn from '~/components/table/common/previewableFilesColumn.vue'
import BooleanColumn from '~/components/table/common/booleanColumn.vue'
import RecordColumn from '~/components/table/common/recordColumn.vue'
import SubmissionStatusColumn from '~/components/table/common/submissionStatusColumn.vue'
import ResultColumn from '~/components/table/common/resultColumn.vue'
import SubmissionTypeColumn from '~/components/table/common/submissionTypeColumn.vue'
import ViewRecordTableInterface from '~/components/interface/crud/viewRecordTableInterface.vue'
import EditSubmissionInterface from '~/components/interface/crud/special/editSubmissionInterface.vue'
import CrudSubmissionInterface from '~/components/interface/crud/special/crudSubmissionInterface.vue'
import {
  generateDateLocaleString,
  generateParseDateTimeStringFn,
} from '~/services/base'
import TruthyOrNoneColumn from '~/components/table/common/truthyOrNoneColumn.vue'
import UrlsColumn from '~/components/table/common/urlsColumn.vue'
import ParticipantsColumn from '~/components/table/common/participantsColumn.vue'
import { getEras, getEvents, getSubmissionStatuses } from '~/services/dropdown'
import { serializeTime } from '~/services/common'

export const Submission = <RecordInfo<'submission'>>{
  typename: 'submission',
  pluralTypename: 'submissions',
  name: 'Submission',
  pluralName: 'Submissions',
  icon: 'mdi-timer',
  routeName: 'a-view',
  // renderItem: (item) => item.name,
  fields: {
    id: {
      text: 'ID',
    },
    'event.id': {
      text: 'Event Category',
      inputType: 'server-autocomplete',
      inputOptions: {
        hasAvatar: true,
        typename: 'event',
      },
      getOptions: getEvents,
    },
    'event.__typename': {},
    'event.avatar': {},
    'event.name': {},
    'event.name+event.avatar+event.id+event.__typename': {
      text: 'Event Category',
      component: RecordColumn,
      compoundOptions: {
        pathPrefix: 'event',
        primaryField: 'event.name',
      },
    },
    'event.name+event.avatar+event.id+event.__typename+participants': {
      text: 'Event Category',
      component: SubmissionTypeColumn,
      compoundOptions: {
        primaryField: 'event.name',
      },
    },
    'era.name': {},
    'era.avatar': {},
    'era.__typename': {},
    'era.id': {
      text: 'Era',
      inputType: 'server-autocomplete',
      inputOptions: {
        hasAvatar: true,
        typename: 'era',
      },
      getOptions: getEras,
      default: async (that) => {
        const eras = await getEras(that)

        return eras.find((era) => era.isCurrent)?.id ?? null
      },
    },
    'era.name+era.avatar+era.id+era.__typename': {
      text: 'Era',
      component: RecordColumn,
      compoundOptions: {
        pathPrefix: 'era',
        primaryField: 'era.name',
      },
    },

    participants: {
      text: 'Participants Count',
    },
    participantsList: {
      text: 'Team Members',
      inputType: 'key-value-array',
      inputOptions: {
        nestedInputType: 'server-combobox',
        nestedKeyText: 'Discord ID',
        nestedValueText: 'RSN',
        typename: 'character',
      },
    },
    'participantsList.id': {},
    'participantsList.title': {},
    'participantsList.character.id': {},
    'participantsList.character.name': {},
    'participantsList.character.avatar': {},
    'participantsList.character.__typename': {},

    'participantsList.id+participantsList.title+participantsList.character.id+participantsList.character.name+participantsList.character.avatar+participantsList.character.__typename':
      {
        text: 'Team Members',
        component: ParticipantsColumn,
        compoundOptions: {
          pathPrefix: 'participantsList',
          primaryField: 'participantsList.name',
        },
      },
    externalLinks: {
      text: 'External Links',
      inputType: 'value-array',
      inputOptions: {
        nestedInputType: 'text',
        nestedValueText: 'Link URL',
      },
      component: UrlsColumn,
    },
    score: {
      text: 'Result',
      component: ResultColumn,
    },
    timeElapsed: {
      text: 'Time',
      hint: 'Type in the numbers only, the numbers will be auto-formatted',
      inputRules: [
        (value) => {
          const regEx = /^(\d+:)?([0-5]?\d:)?[0-5]?\d\.\d{1}$/
          return (
            !value ||
            regEx.test(value) ||
            'Invalid Time Format, must be like 12:34:56.7'
          )
        },
      ],
      serialize: serializeTime,
      parseValue: (value) => {
        if (!value) return null
        if (typeof value !== 'string') throw new Error('Invalid value')
        const regEx = /^(\d+:)?([0-5]?\d:)?[0-5]?\d\.\d{1}$/
        if (!regEx.test(value)) throw new Error('Invalid value')

        // convert string to number of ms.
        const parts = value.split('.')

        let ms = 0

        ms += Number(parts[parts.length - 1]) * 100

        const firstParts = parts[0].split(':')

        if (firstParts.length > 1) {
          ms += (Number(firstParts[0]) * 60 + Number(firstParts[1])) * 1000
        } else {
          ms += Number(firstParts[0]) * 1000
        }
        // round to tens
        return 10 * Math.floor(ms / 10)
      },
    },
    happenedOn: {
      text: 'Happened On',
      inputType: 'datepicker',
      hint: 'To specify the exact date and time, use format: YYYY-MM-DD 1:23 PM',
      // unix timestamp to YYYY-MM-DD HH:MM:SS
      serialize: generateDateLocaleString,
      // YYYY-MM-DD to unix timestamp
      parseValue: generateParseDateTimeStringFn('startOfDay'),
      component: TruthyOrNoneColumn,
    },
    status: {
      text: 'Status',
      getOptions: getSubmissionStatuses,
      inputType: 'select',
      component: SubmissionStatusColumn,
    },
    isCurrent: {
      text: 'Is Current',
      inputType: 'switch',
      component: BooleanColumn,
    },
    world: {
      text: 'World',
      optional: true,
    },
    files: {
      text: 'Files',
      inputType: 'multiple-file',
      default: () => [],
      /*       parseValue: (val) =>
        Array.isArray(val) ? val.map((ele) => ele.id) : null, */
      component: PreviewableFilesColumn,
    },
    privateComments: {
      text: 'Private Comments',
      inputType: 'textarea',
    },
    publicComments: {
      text: 'Public Comments',
      inputType: 'textarea',
    },
    ranking: {
      text: 'Era Ranking',
    },
    submittedBy: {
      text: 'Submitted By',
      hint: 'RSN',
    },
    discordId: {
      text: 'Discord ID',
      optional: true,
    },
    'createdBy.id': {
      text: 'Created By',
    },
    createdAt: {
      text: 'Created At',
      component: TimeagoColumn,
    },
    updatedAt: {
      text: 'Updated At',
      component: TimeagoColumn,
    },
  },
  paginationOptions: {
    hasSearch: false,
    handleRowClick: (that, item) => {
      that.openEditDialog('view', item)
    },
    filters: [
      {
        field: 'status',
        operator: 'in',
        inputType: 'multiple-select',
      },
      {
        field: 'era.id',
        operator: 'eq',
        inputType: 'select',
      },
      {
        field: 'event.id',
        operator: 'eq',
        inputType: 'select',
      },
      {
        field: 'participants',
        operator: 'eq',
        inputType: 'text',
      },
    ],
    headers: [
      {
        field: 'event.name+event.avatar+event.id+event.__typename+participants',
        sortable: false,
      },
      {
        field: 'era.name+era.avatar+era.id+era.__typename',
        width: '150px',
        sortable: false,
      },
      {
        field: 'status',
        width: '150px',
        sortable: false,
      },
      {
        field: 'score',
        width: '100px',
        sortable: true,
        align: 'right',
      },
      {
        field: 'createdAt',
        width: '150px',
        sortable: true,
      },
      {
        field: 'updatedAt',
        width: '150px',
        sortable: true,
      },
    ],
    downloadOptions: {},
    interfaceComponent: CrudSubmissionInterface,
  },
  addOptions: {
    fields: [
      'event.id',
      'era.id',
      'participantsList',
      'timeElapsed',
      'happenedOn',
      'world',
      // 'files',
      'externalLinks',
      'privateComments',
      'publicComments',
    ],

    component: EditSubmissionInterface,
  },
  // importOptions: { fields: ['avatar', 'name', 'description', 'isPublic'] },
  editOptions: {
    fields: [
      'event.id',
      'era.id',
      'timeElapsed',
      'world',
      // 'files',
      'externalLinks',
      'happenedOn',
      'privateComments',
      'publicComments',
    ],
    component: EditSubmissionInterface,
  },
  viewOptions: {
    fields: [
      'event.name+event.avatar+event.id+event.__typename+participants',
      // 'event.name+event.avatar+event.id+event.__typename',
      'era.name+era.avatar+era.id+era.__typename',
      // 'participants',
      'participantsList.id+participantsList.title+participantsList.character.id+participantsList.character.name+participantsList.character.avatar+participantsList.character.__typename',
      'score',
      'happenedOn',
      'status',
      // 'score',
      'world',
      'ranking',
      // 'files',
      'externalLinks',
      'privateComments',
      'publicComments',
    ],
    component: ViewRecordTableInterface,
  },
  enterOptions: {},
  deleteOptions: {},
  shareOptions: {},
  expandTypes: [],
}

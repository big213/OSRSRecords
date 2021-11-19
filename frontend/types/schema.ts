// Query builder (Typescript version >= 4.1.3 required)
/* const queryResult = executeGiraffeql({
  // Start typing here to get hints
  
}); */

export function executeGiraffeql<Key extends keyof Root>(
  query: GetQuery<Key>
): GetResponse<Key> {
  let data: any
  return data
}

// scaffolding
export type GetQuery<K extends keyof Root> = K extends never
  ? Partial<Record<K, Queryize<Root[keyof Root]>>>
  : Record<K, Queryize<Root[K]>>

export type GetResponse<K extends keyof Root> = Responseize<Root[K]>

export type GetType<T> = Responseize<Field<T, undefined>>

type Primitive = string | number | boolean | undefined | null

type Field<T, K> = {
  Type: T
  Args: K
}

type Responseize<T> = T extends Field<infer Type, infer Args>
  ? Type extends never
    ? never
    : Type extends (infer U)[]
    ? { [P in keyof U]: Responseize<U[P]> }[]
    : { [P in keyof Type]: Responseize<Type[P]> }
  : never

type Queryize<T> = T extends Field<infer Type, infer Args>
  ? Type extends never
    ? never
    : Type extends Primitive
    ? Args extends undefined // Args is undefined
      ? LookupValue
      : Args extends [infer Arg]
      ? LookupValue | { __args: Arg } // Args is a tuple
      : { __args: Args }
    : Type extends (infer U)[]
    ? Queryize<Field<U, Args>>
    : Args extends undefined // Args is undefined
    ? { [P in keyof Type]?: Queryize<Type[P]> }
    : Args extends [infer Arg]
    ? { [P in keyof Type]?: Queryize<Type[P]> } & {
        __args?: Arg
      }
    : { [P in keyof Type]?: Queryize<Type[P]> } & { __args: Args }
  : never

type LookupValue = true

type Edge<T> = {
  __typename: Field<string, undefined>
  node: Field<T, undefined>
  cursor: Field<string, undefined>
}

export type FilterByField<T> = {
  eq?: T
  neq?: T
  gt?: T
  lt?: T
  in?: T[]
  nin?: T[]
  regex?: Scalars['regex']
}

/**All Scalar values*/ export type Scalars = {
  /**String value*/ string: string
  /**True or False*/ boolean: boolean
  /**Numeric value*/ number: number
  /**Unknown value*/ unknown: unknown
  /**Image URL Field*/ imageUrl: string
  /**URL Field*/ url: string
  /**UNIX Timestamp (Seconds since Epoch Time)*/ unixTimestamp: number
  /**Date YYYY-MM-DD*/ date: string
  /**ID Field*/ id: string
  /**Regex Field*/ regex: RegExp
  /**Valid JSON*/ json: unknown
  /**Valid JSON as a string*/ jsonString: string
  /**Enum stored as a separate key value*/ submissionStatus:
    | 'SUBMITTED'
    | 'UNDER_REVIEW'
    | 'APPROVED'
    | 'INFORMATION_REQUESTED'
    | 'REJECTED'
  /**Enum stored as a separate key value*/ userRole:
    | 'NONE'
    | 'NORMAL'
    | 'ADMIN'
    | 'CUSTOM'
    | 'MODERATOR'
  /**Enum stored as is*/ userPermission:
    | 'A_A'
    | 'user_x'
    | 'user_get'
    | 'user_getMultiple'
    | 'user_update'
    | 'user_create'
    | 'user_delete'
    | 'file_getMultiple'
  submissionCharacterParticipantLinkSortByKey: 'createdAt'
  submissionCharacterParticipantLinkGroupByKey: undefined
  userSortByKey: 'id' | 'createdAt' | 'updatedAt'
  userGroupByKey: undefined
  apiKeySortByKey: 'id' | 'createdAt'
  apiKeyGroupByKey: undefined
  eraSortByKey: 'id' | 'createdAt' | 'updatedAt'
  eraGroupByKey: undefined
  eventClassSortByKey: 'id' | 'createdAt' | 'updatedAt'
  eventClassGroupByKey: undefined
  eventSortByKey: 'id' | 'createdAt' | 'updatedAt' | 'name'
  eventGroupByKey: undefined
  submissionSortByKey: 'id' | 'createdAt' | 'updatedAt' | 'score'
  submissionGroupByKey: undefined
  characterSortByKey: 'id' | 'createdAt' | 'updatedAt'
  characterGroupByKey: undefined
  fileSortByKey: 'id' | 'createdAt'
  fileGroupByKey: undefined
}
/**All Input types*/ export type InputTypes = {
  'submissionCharacterParticipantLinkFilterByField/submission.id': FilterByField<
    Scalars['id']
  >
  'submissionCharacterParticipantLinkFilterByField/character.id': FilterByField<
    Scalars['id']
  >
  submissionCharacterParticipantLinkFilterByObject: {
    'submission.id'?: InputTypes['submissionCharacterParticipantLinkFilterByField/submission.id']
    'character.id'?: InputTypes['submissionCharacterParticipantLinkFilterByField/character.id']
  }
  submissionCharacterParticipantLinkPaginator: {
    first?: Scalars['number']
    last?: Scalars['number']
    after?: Scalars['string']
    before?: Scalars['string']
    sortBy?: Scalars['submissionCharacterParticipantLinkSortByKey'][]
    sortDesc?: Scalars['boolean'][]
    filterBy?: InputTypes['submissionCharacterParticipantLinkFilterByObject'][]
    groupBy?: Scalars['submissionCharacterParticipantLinkGroupByKey'][]
  }
  /**Input object for syncCurrentUser*/ syncCurrentUser: {
    email: Scalars['string']
  }
  user: { id?: Scalars['id'] }
  'userFilterByField/id': FilterByField<Scalars['id']>
  'userFilterByField/createdBy.name': FilterByField<Scalars['string']>
  'userFilterByField/isPublic': FilterByField<Scalars['boolean']>
  'userFilterByField/role': FilterByField<Scalars['userRole']>
  userFilterByObject: {
    id?: InputTypes['userFilterByField/id']
    'createdBy.name'?: InputTypes['userFilterByField/createdBy.name']
    isPublic?: InputTypes['userFilterByField/isPublic']
    role?: InputTypes['userFilterByField/role']
  }
  userPaginator: {
    first?: Scalars['number']
    last?: Scalars['number']
    after?: Scalars['string']
    before?: Scalars['string']
    sortBy?: Scalars['userSortByKey'][]
    sortDesc?: Scalars['boolean'][]
    filterBy?: InputTypes['userFilterByObject'][]
    groupBy?: Scalars['userGroupByKey'][]
    search?: Scalars['string']
  }
  createUser: {
    name: Scalars['string']
    firebaseUid: Scalars['string']
    email: Scalars['string']
    password: Scalars['string']
    avatar?: Scalars['string'] | null
    role?: Scalars['userRole']
    permissions?: Scalars['userPermission'][] | null
    isPublic?: Scalars['boolean']
  }
  updateUserFields: {
    name?: Scalars['string']
    firebaseUid?: Scalars['string']
    email?: Scalars['string']
    password?: Scalars['string']
    avatar?: Scalars['string'] | null
    role?: Scalars['userRole']
    permissions?: Scalars['userPermission'][] | null
    isPublic?: Scalars['boolean']
  }
  updateUser: {
    item: InputTypes['user']
    fields: InputTypes['updateUserFields']
  }
  apiKey: { id?: Scalars['id'] }
  'apiKeyFilterByField/id': FilterByField<Scalars['id']>
  'apiKeyFilterByField/user.id': FilterByField<Scalars['id']>
  apiKeyFilterByObject: {
    id?: InputTypes['apiKeyFilterByField/id']
    'user.id'?: InputTypes['apiKeyFilterByField/user.id']
  }
  apiKeyPaginator: {
    first?: Scalars['number']
    last?: Scalars['number']
    after?: Scalars['string']
    before?: Scalars['string']
    sortBy?: Scalars['apiKeySortByKey'][]
    sortDesc?: Scalars['boolean'][]
    filterBy?: InputTypes['apiKeyFilterByObject'][]
    groupBy?: Scalars['apiKeyGroupByKey'][]
    search?: Scalars['string']
  }
  createApiKey: {
    name: Scalars['string']
    user: InputTypes['user']
    permissions?: Scalars['userPermission'][] | null
  }
  updateApiKeyFields: {
    name?: Scalars['string']
    user?: InputTypes['user']
    permissions?: Scalars['userPermission'][] | null
  }
  updateApiKey: {
    item: InputTypes['apiKey']
    fields: InputTypes['updateApiKeyFields']
  }
  era: { id?: Scalars['id'] }
  'eraFilterByField/id': FilterByField<Scalars['id']>
  'eraFilterByField/createdBy.id': FilterByField<Scalars['id']>
  eraFilterByObject: {
    id?: InputTypes['eraFilterByField/id']
    'createdBy.id'?: InputTypes['eraFilterByField/createdBy.id']
  }
  eraPaginator: {
    first?: Scalars['number']
    last?: Scalars['number']
    after?: Scalars['string']
    before?: Scalars['string']
    sortBy?: Scalars['eraSortByKey'][]
    sortDesc?: Scalars['boolean'][]
    filterBy?: InputTypes['eraFilterByObject'][]
    groupBy?: Scalars['eraGroupByKey'][]
    search?: Scalars['string']
  }
  createEra: {
    name: Scalars['string']
    avatar?: Scalars['string'] | null
    description?: Scalars['string'] | null
    beginDate: Scalars['unixTimestamp']
    endDate?: Scalars['unixTimestamp'] | null
    isCurrent?: Scalars['boolean']
  }
  updateEraFields: {
    name?: Scalars['string']
    avatar?: Scalars['string'] | null
    description?: Scalars['string'] | null
    beginDate?: Scalars['unixTimestamp']
    endDate?: Scalars['unixTimestamp'] | null
    isCurrent?: Scalars['boolean']
  }
  updateEra: { item: InputTypes['era']; fields: InputTypes['updateEraFields'] }
  eventClass: { id?: Scalars['id'] }
  'eventClassFilterByField/id': FilterByField<Scalars['id']>
  'eventClassFilterByField/createdBy.id': FilterByField<Scalars['id']>
  eventClassFilterByObject: {
    id?: InputTypes['eventClassFilterByField/id']
    'createdBy.id'?: InputTypes['eventClassFilterByField/createdBy.id']
  }
  eventClassPaginator: {
    first?: Scalars['number']
    last?: Scalars['number']
    after?: Scalars['string']
    before?: Scalars['string']
    sortBy?: Scalars['eventClassSortByKey'][]
    sortDesc?: Scalars['boolean'][]
    filterBy?: InputTypes['eventClassFilterByObject'][]
    groupBy?: Scalars['eventClassGroupByKey'][]
    search?: Scalars['string']
  }
  createEventClass: {
    name: Scalars['string']
    avatar?: Scalars['string'] | null
    description?: Scalars['string'] | null
    isSubEvent: Scalars['boolean']
  }
  updateEventClassFields: {
    name?: Scalars['string']
    avatar?: Scalars['string'] | null
    description?: Scalars['string'] | null
    isSubEvent?: Scalars['boolean']
  }
  updateEventClass: {
    item: InputTypes['eventClass']
    fields: InputTypes['updateEventClassFields']
  }
  event: { id?: Scalars['id'] }
  'eventFilterByField/id': FilterByField<Scalars['id']>
  'eventFilterByField/createdBy.id': FilterByField<Scalars['id']>
  eventFilterByObject: {
    id?: InputTypes['eventFilterByField/id']
    'createdBy.id'?: InputTypes['eventFilterByField/createdBy.id']
  }
  eventPaginator: {
    first?: Scalars['number']
    last?: Scalars['number']
    after?: Scalars['string']
    before?: Scalars['string']
    sortBy?: Scalars['eventSortByKey'][]
    sortDesc?: Scalars['boolean'][]
    filterBy?: InputTypes['eventFilterByObject'][]
    groupBy?: Scalars['eventGroupByKey'][]
    search?: Scalars['string']
  }
  createEvent: {
    eventClass: InputTypes['eventClass']
    minParticipants?: Scalars['number'] | null
    maxParticipants?: Scalars['number'] | null
    releaseDate: Scalars['unixTimestamp']
    avatar?: Scalars['string'] | null
    name: Scalars['string']
    description?: Scalars['string'] | null
    isHardMode: Scalars['boolean']
  }
  updateEventFields: {
    eventClass?: InputTypes['eventClass']
    minParticipants?: Scalars['number'] | null
    maxParticipants?: Scalars['number'] | null
    releaseDate?: Scalars['unixTimestamp']
    avatar?: Scalars['string'] | null
    name?: Scalars['string']
    description?: Scalars['string'] | null
    isHardMode?: Scalars['boolean']
  }
  updateEvent: {
    item: InputTypes['event']
    fields: InputTypes['updateEventFields']
  }
  submission: { id?: Scalars['id'] }
  'submissionFilterByField/id': FilterByField<Scalars['id']>
  'submissionFilterByField/createdBy.id': FilterByField<Scalars['id']>
  'submissionFilterByField/event.id': FilterByField<Scalars['id']>
  'submissionFilterByField/participants': FilterByField<Scalars['number']>
  'submissionFilterByField/status': FilterByField<Scalars['submissionStatus']>
  submissionFilterByObject: {
    id?: InputTypes['submissionFilterByField/id']
    'createdBy.id'?: InputTypes['submissionFilterByField/createdBy.id']
    'event.id'?: InputTypes['submissionFilterByField/event.id']
    participants?: InputTypes['submissionFilterByField/participants']
    status?: InputTypes['submissionFilterByField/status']
  }
  submissionPaginator: {
    first?: Scalars['number']
    last?: Scalars['number']
    after?: Scalars['string']
    before?: Scalars['string']
    sortBy?: Scalars['submissionSortByKey'][]
    sortDesc?: Scalars['boolean'][]
    filterBy?: InputTypes['submissionFilterByObject'][]
    groupBy?: Scalars['submissionGroupByKey'][]
    search?: Scalars['string']
  }
  createSubmission: {
    event: InputTypes['event']
    era: InputTypes['era']
    participants?: Scalars['number']
    timeElapsed: Scalars['number']
    happenedOn: Scalars['unixTimestamp']
    world?: Scalars['number'] | null
    files?: Scalars['id'][]
    externalLinks?: Scalars['url'][]
    privateComments?: Scalars['string'] | null
    publicComments?: Scalars['string'] | null
    submittedBy?: Scalars['string'] | null
    discordId?: Scalars['string'] | null
  }
  updateSubmissionFields: {
    event?: InputTypes['event']
    era?: InputTypes['era']
    participants?: Scalars['number']
    timeElapsed?: Scalars['number']
    happenedOn?: Scalars['unixTimestamp']
    status?: Scalars['submissionStatus']
    world?: Scalars['number'] | null
    files?: Scalars['id'][]
    externalLinks?: Scalars['url'][]
    privateComments?: Scalars['string'] | null
    publicComments?: Scalars['string'] | null
    submittedBy?: Scalars['string'] | null
    discordId?: Scalars['string'] | null
  }
  updateSubmission: {
    item: InputTypes['submission']
    fields: InputTypes['updateSubmissionFields']
  }
  character: { id?: Scalars['id'] }
  'characterFilterByField/id': FilterByField<Scalars['id']>
  'characterFilterByField/createdBy.id': FilterByField<Scalars['id']>
  'characterFilterByField/submissionCharacterParticipantLink/character.id': FilterByField<
    Scalars['id']
  >
  characterFilterByObject: {
    id?: InputTypes['characterFilterByField/id']
    'createdBy.id'?: InputTypes['characterFilterByField/createdBy.id']
    'submissionCharacterParticipantLink/character.id'?: InputTypes['characterFilterByField/submissionCharacterParticipantLink/character.id']
  }
  characterPaginator: {
    first?: Scalars['number']
    last?: Scalars['number']
    after?: Scalars['string']
    before?: Scalars['string']
    sortBy?: Scalars['characterSortByKey'][]
    sortDesc?: Scalars['boolean'][]
    filterBy?: InputTypes['characterFilterByObject'][]
    groupBy?: Scalars['characterGroupByKey'][]
    search?: Scalars['string']
  }
  createCharacter: {
    name: Scalars['string']
    avatar?: Scalars['string'] | null
    description?: Scalars['string'] | null
    ownedBy?: InputTypes['user'] | null
  }
  updateCharacterFields: {
    name?: Scalars['string']
    avatar?: Scalars['string'] | null
    description?: Scalars['string'] | null
    ownedBy?: InputTypes['user'] | null
  }
  updateCharacter: {
    item: InputTypes['character']
    fields: InputTypes['updateCharacterFields']
  }
  /**Input object for getRepositoryReleases*/ getRepositoryReleases: {
    first: Scalars['number']
  }
  file: { id?: Scalars['id'] }
  'fileFilterByField/id': FilterByField<Scalars['id']>
  'fileFilterByField/createdBy.id': FilterByField<Scalars['id']>
  'fileFilterByField/parentKey': FilterByField<Scalars['string']>
  fileFilterByObject: {
    id?: InputTypes['fileFilterByField/id']
    'createdBy.id'?: InputTypes['fileFilterByField/createdBy.id']
    parentKey?: InputTypes['fileFilterByField/parentKey']
  }
  filePaginator: {
    first?: Scalars['number']
    last?: Scalars['number']
    after?: Scalars['string']
    before?: Scalars['string']
    sortBy?: Scalars['fileSortByKey'][]
    sortDesc?: Scalars['boolean'][]
    filterBy?: InputTypes['fileFilterByObject'][]
    groupBy?: Scalars['fileGroupByKey'][]
    search?: Scalars['string']
  }
  createFile: {
    name: Scalars['string']
    location: Scalars['string']
    parentKey?: Scalars['string'] | null
  }
  updateFileFields: { name?: Scalars['string'] }
  updateFile: {
    item: InputTypes['file']
    fields: InputTypes['updateFileFields']
  }
  submissionCharacterParticipantLink: {
    id?: Scalars['id']
    submission?: InputTypes['submission']
    character?: InputTypes['character']
  }
  updateSubmissionCharacterParticipantLinkFields: {
    submission?: InputTypes['submission']
    character?: InputTypes['character']
    title?: Scalars['string'] | null
  }
  updateSubmissionCharacterParticipantLink: {
    item: InputTypes['submissionCharacterParticipantLink']
    fields: InputTypes['updateSubmissionCharacterParticipantLinkFields']
  }
  createSubmissionCharacterParticipantLink: {
    submission: InputTypes['submission']
    character: InputTypes['character']
    title?: Scalars['string'] | null
  }
}
/**All main types*/ export type MainTypes = {
  paginatorInfo: { Typename: 'paginatorInfo'; Type: GetType<PaginatorInfo> }
  userEdge: { Typename: 'userEdge'; Type: GetType<UserEdge> }
  userPaginator: { Typename: 'userPaginator'; Type: GetType<UserPaginator> }
  apiKeyEdge: { Typename: 'apiKeyEdge'; Type: GetType<ApiKeyEdge> }
  apiKeyPaginator: {
    Typename: 'apiKeyPaginator'
    Type: GetType<ApiKeyPaginator>
  }
  eraEdge: { Typename: 'eraEdge'; Type: GetType<EraEdge> }
  eraPaginator: { Typename: 'eraPaginator'; Type: GetType<EraPaginator> }
  eventClassEdge: { Typename: 'eventClassEdge'; Type: GetType<EventClassEdge> }
  eventClassPaginator: {
    Typename: 'eventClassPaginator'
    Type: GetType<EventClassPaginator>
  }
  eventEdge: { Typename: 'eventEdge'; Type: GetType<EventEdge> }
  eventPaginator: { Typename: 'eventPaginator'; Type: GetType<EventPaginator> }
  submissionEdge: { Typename: 'submissionEdge'; Type: GetType<SubmissionEdge> }
  submissionPaginator: {
    Typename: 'submissionPaginator'
    Type: GetType<SubmissionPaginator>
  }
  characterEdge: { Typename: 'characterEdge'; Type: GetType<CharacterEdge> }
  characterPaginator: {
    Typename: 'characterPaginator'
    Type: GetType<CharacterPaginator>
  }
  fileEdge: { Typename: 'fileEdge'; Type: GetType<FileEdge> }
  filePaginator: { Typename: 'filePaginator'; Type: GetType<FilePaginator> }
  submissionCharacterParticipantLinkEdge: {
    Typename: 'submissionCharacterParticipantLinkEdge'
    Type: GetType<SubmissionCharacterParticipantLinkEdge>
  }
  submissionCharacterParticipantLinkPaginator: {
    Typename: 'submissionCharacterParticipantLinkPaginator'
    Type: GetType<SubmissionCharacterParticipantLinkPaginator>
  }
  userRoleEnumPaginator: {
    Typename: 'userRoleEnumPaginator'
    Type: GetType<UserRoleEnumPaginator>
  }
  submissionStatusEnumPaginator: {
    Typename: 'submissionStatusEnumPaginator'
    Type: GetType<SubmissionStatusEnumPaginator>
  }
  user: { Typename: 'user'; Type: GetType<User> }
  apiKey: { Typename: 'apiKey'; Type: GetType<ApiKey> }
  era: { Typename: 'era'; Type: GetType<Era> }
  eventClass: { Typename: 'eventClass'; Type: GetType<EventClass> }
  event: { Typename: 'event'; Type: GetType<Event> }
  submission: { Typename: 'submission'; Type: GetType<Submission> }
  character: { Typename: 'character'; Type: GetType<Character> }
  file: { Typename: 'file'; Type: GetType<File> }
  submissionCharacterParticipantLink: {
    Typename: 'submissionCharacterParticipantLink'
    Type: GetType<SubmissionCharacterParticipantLink>
  }
}
/**PaginatorInfo Type*/ export type PaginatorInfo = {
  /**The typename of the record*/ __typename: {
    Type: Scalars['string']
    Args: [Scalars['number']]
  }
  total: { Type: Scalars['number']; Args: undefined }
  count: { Type: Scalars['number']; Args: undefined }
  startCursor: { Type: Scalars['string'] | null; Args: undefined }
  endCursor: { Type: Scalars['string'] | null; Args: undefined }
}
export type UserEdge = Edge<User>
/**Paginator*/ export type UserPaginator = {
  /**The typename of the record*/ __typename: {
    Type: Scalars['string']
    Args: [Scalars['number']]
  }
  paginatorInfo: { Type: PaginatorInfo; Args: undefined }
  edges: { Type: UserEdge[]; Args: undefined }
}
export type ApiKeyEdge = Edge<ApiKey>
/**Paginator*/ export type ApiKeyPaginator = {
  /**The typename of the record*/ __typename: {
    Type: Scalars['string']
    Args: [Scalars['number']]
  }
  paginatorInfo: { Type: PaginatorInfo; Args: undefined }
  edges: { Type: ApiKeyEdge[]; Args: undefined }
}
export type EraEdge = Edge<Era>
/**Paginator*/ export type EraPaginator = {
  /**The typename of the record*/ __typename: {
    Type: Scalars['string']
    Args: [Scalars['number']]
  }
  paginatorInfo: { Type: PaginatorInfo; Args: undefined }
  edges: { Type: EraEdge[]; Args: undefined }
}
export type EventClassEdge = Edge<EventClass>
/**Paginator*/ export type EventClassPaginator = {
  /**The typename of the record*/ __typename: {
    Type: Scalars['string']
    Args: [Scalars['number']]
  }
  paginatorInfo: { Type: PaginatorInfo; Args: undefined }
  edges: { Type: EventClassEdge[]; Args: undefined }
}
export type EventEdge = Edge<Event>
/**Paginator*/ export type EventPaginator = {
  /**The typename of the record*/ __typename: {
    Type: Scalars['string']
    Args: [Scalars['number']]
  }
  paginatorInfo: { Type: PaginatorInfo; Args: undefined }
  edges: { Type: EventEdge[]; Args: undefined }
}
export type SubmissionEdge = Edge<Submission>
/**Paginator*/ export type SubmissionPaginator = {
  /**The typename of the record*/ __typename: {
    Type: Scalars['string']
    Args: [Scalars['number']]
  }
  paginatorInfo: { Type: PaginatorInfo; Args: undefined }
  edges: { Type: SubmissionEdge[]; Args: undefined }
}
export type CharacterEdge = Edge<Character>
/**Paginator*/ export type CharacterPaginator = {
  /**The typename of the record*/ __typename: {
    Type: Scalars['string']
    Args: [Scalars['number']]
  }
  paginatorInfo: { Type: PaginatorInfo; Args: undefined }
  edges: { Type: CharacterEdge[]; Args: undefined }
}
export type FileEdge = Edge<File>
/**Paginator*/ export type FilePaginator = {
  /**The typename of the record*/ __typename: {
    Type: Scalars['string']
    Args: [Scalars['number']]
  }
  paginatorInfo: { Type: PaginatorInfo; Args: undefined }
  edges: { Type: FileEdge[]; Args: undefined }
}
export type SubmissionCharacterParticipantLinkEdge =
  Edge<SubmissionCharacterParticipantLink>
/**Paginator*/ export type SubmissionCharacterParticipantLinkPaginator = {
  /**The typename of the record*/ __typename: {
    Type: Scalars['string']
    Args: [Scalars['number']]
  }
  paginatorInfo: { Type: PaginatorInfo; Args: undefined }
  edges: { Type: SubmissionCharacterParticipantLinkEdge[]; Args: undefined }
}
/**EnumPaginator*/ export type UserRoleEnumPaginator = {
  /**The typename of the record*/ __typename: {
    Type: Scalars['string']
    Args: [Scalars['number']]
  }
  values: { Type: Scalars['userRole'][]; Args: undefined }
}
/**EnumPaginator*/ export type SubmissionStatusEnumPaginator = {
  /**The typename of the record*/ __typename: {
    Type: Scalars['string']
    Args: [Scalars['number']]
  }
  values: { Type: Scalars['submissionStatus'][]; Args: undefined }
}
/**User type*/ export type User = {
  /**The unique ID of the field*/ id: { Type: Scalars['id']; Args: undefined }
  /**The typename of the record*/ __typename: {
    Type: Scalars['string']
    Args: [Scalars['number']]
  }
  name: { Type: Scalars['string']; Args: undefined }
  firebaseUid: { Type: never; Args: undefined }
  email: { Type: Scalars['string']; Args: undefined }
  password: { Type: never; Args: undefined }
  avatar: { Type: Scalars['string'] | null; Args: undefined }
  role: { Type: Scalars['userRole']; Args: undefined }
  permissions: { Type: Scalars['userPermission'][] | null; Args: undefined }
  allPermissions: { Type: Scalars['userPermission'][]; Args: undefined }
  isPublic: { Type: Scalars['boolean']; Args: undefined }
  /**When the record was created*/ createdAt: {
    Type: Scalars['unixTimestamp']
    Args: undefined
  }
  /**When the record was last updated*/ updatedAt: {
    Type: Scalars['unixTimestamp'] | null
    Args: undefined
  }
  createdBy: { Type: User; Args: undefined }
}
/**Api key*/ export type ApiKey = {
  /**The unique ID of the field*/ id: { Type: Scalars['id']; Args: undefined }
  /**The typename of the record*/ __typename: {
    Type: Scalars['string']
    Args: [Scalars['number']]
  }
  name: { Type: Scalars['string']; Args: undefined }
  code: { Type: Scalars['string']; Args: undefined }
  user: { Type: User; Args: undefined }
  permissions: { Type: Scalars['userPermission'][] | null; Args: undefined }
  /**When the record was created*/ createdAt: {
    Type: Scalars['unixTimestamp']
    Args: undefined
  }
  /**When the record was last updated*/ updatedAt: {
    Type: Scalars['unixTimestamp'] | null
    Args: undefined
  }
  createdBy: { Type: User; Args: undefined }
}
/**Era type*/ export type Era = {
  /**The unique ID of the field*/ id: { Type: Scalars['id']; Args: undefined }
  /**The typename of the record*/ __typename: {
    Type: Scalars['string']
    Args: [Scalars['number']]
  }
  name: { Type: Scalars['string']; Args: undefined }
  avatar: { Type: Scalars['string'] | null; Args: undefined }
  description: { Type: Scalars['string'] | null; Args: undefined }
  beginDate: { Type: Scalars['unixTimestamp']; Args: undefined }
  endDate: { Type: Scalars['unixTimestamp'] | null; Args: undefined }
  isCurrent: { Type: Scalars['boolean']; Args: undefined }
  /**When the record was created*/ createdAt: {
    Type: Scalars['unixTimestamp']
    Args: undefined
  }
  /**When the record was last updated*/ updatedAt: {
    Type: Scalars['unixTimestamp'] | null
    Args: undefined
  }
  createdBy: { Type: User; Args: undefined }
}
/**Event Class type*/ export type EventClass = {
  /**The unique ID of the field*/ id: { Type: Scalars['id']; Args: undefined }
  /**The typename of the record*/ __typename: {
    Type: Scalars['string']
    Args: [Scalars['number']]
  }
  name: { Type: Scalars['string']; Args: undefined }
  avatar: { Type: Scalars['string'] | null; Args: undefined }
  description: { Type: Scalars['string'] | null; Args: undefined }
  isSubEvent: { Type: Scalars['boolean']; Args: undefined }
  /**When the record was created*/ createdAt: {
    Type: Scalars['unixTimestamp']
    Args: undefined
  }
  /**When the record was last updated*/ updatedAt: {
    Type: Scalars['unixTimestamp'] | null
    Args: undefined
  }
  createdBy: { Type: User; Args: undefined }
}
/**Event type*/ export type Event = {
  /**The unique ID of the field*/ id: { Type: Scalars['id']; Args: undefined }
  /**The typename of the record*/ __typename: {
    Type: Scalars['string']
    Args: [Scalars['number']]
  }
  eventClass: { Type: EventClass; Args: undefined }
  minParticipants: { Type: Scalars['number'] | null; Args: undefined }
  maxParticipants: { Type: Scalars['number'] | null; Args: undefined }
  releaseDate: { Type: Scalars['unixTimestamp']; Args: undefined }
  avatar: { Type: Scalars['string'] | null; Args: undefined }
  name: { Type: Scalars['string']; Args: undefined }
  description: { Type: Scalars['string'] | null; Args: undefined }
  isHardMode: { Type: Scalars['boolean']; Args: undefined }
  /**When the record was created*/ createdAt: {
    Type: Scalars['unixTimestamp']
    Args: undefined
  }
  /**When the record was last updated*/ updatedAt: {
    Type: Scalars['unixTimestamp'] | null
    Args: undefined
  }
  createdBy: { Type: User; Args: undefined }
}
/**Submission type*/ export type Submission = {
  /**The unique ID of the field*/ id: { Type: Scalars['id']; Args: undefined }
  /**The typename of the record*/ __typename: {
    Type: Scalars['string']
    Args: [Scalars['number']]
  }
  event: { Type: Event; Args: undefined }
  era: { Type: Era; Args: undefined }
  participants: { Type: Scalars['number']; Args: undefined }
  participantsLinks: {
    Type: SubmissionCharacterParticipantLinkPaginator
    Args: InputTypes['submissionCharacterParticipantLinkPaginator']
  }
  participantsList: {
    Type: SubmissionCharacterParticipantLink[]
    Args: undefined
  }
  score: { Type: Scalars['number']; Args: undefined }
  timeElapsed: { Type: Scalars['number']; Args: undefined }
  happenedOn: { Type: Scalars['unixTimestamp']; Args: undefined }
  status: { Type: Scalars['submissionStatus']; Args: undefined }
  world: { Type: Scalars['number'] | null; Args: undefined }
  files: { Type: Scalars['id'][]; Args: undefined }
  externalLinks: { Type: Scalars['url'][]; Args: undefined }
  privateComments: { Type: Scalars['string'] | null; Args: undefined }
  publicComments: { Type: Scalars['string'] | null; Args: undefined }
  /**The numerical score rank of this PB given its event, pbClass, and setSize, among public PBs only*/ ranking: {
    Type: Scalars['number'] | null
    Args: undefined
  }
  /**When the record was created*/ createdAt: {
    Type: Scalars['unixTimestamp']
    Args: undefined
  }
  /**When the record was last updated*/ updatedAt: {
    Type: Scalars['unixTimestamp'] | null
    Args: undefined
  }
  createdBy: { Type: User | null; Args: undefined }
  submittedBy: { Type: Scalars['string'] | null; Args: undefined }
  discordId: { Type: Scalars['string'] | null; Args: undefined }
}
/**Character type*/ export type Character = {
  /**The unique ID of the field*/ id: { Type: Scalars['id']; Args: undefined }
  /**The typename of the record*/ __typename: {
    Type: Scalars['string']
    Args: [Scalars['number']]
  }
  name: { Type: Scalars['string']; Args: undefined }
  standardizedName: { Type: Scalars['string']; Args: undefined }
  avatar: { Type: Scalars['string'] | null; Args: undefined }
  description: { Type: Scalars['string'] | null; Args: undefined }
  ownedBy: { Type: User | null; Args: undefined }
  /**When the record was created*/ createdAt: {
    Type: Scalars['unixTimestamp']
    Args: undefined
  }
  /**When the record was last updated*/ updatedAt: {
    Type: Scalars['unixTimestamp'] | null
    Args: undefined
  }
  createdBy: { Type: User | null; Args: undefined }
}
/**File*/ export type File = {
  /**The unique ID of the field*/ id: { Type: Scalars['id']; Args: undefined }
  /**The typename of the record*/ __typename: {
    Type: Scalars['string']
    Args: [Scalars['number']]
  }
  name: { Type: Scalars['string']; Args: undefined }
  size: { Type: Scalars['number']; Args: undefined }
  location: { Type: Scalars['string']; Args: undefined }
  contentType: { Type: Scalars['string']; Args: undefined }
  signedUrl: { Type: Scalars['string']; Args: undefined }
  parentKey: { Type: Scalars['string'] | null; Args: undefined }
  /**When the record was created*/ createdAt: {
    Type: Scalars['unixTimestamp']
    Args: undefined
  }
  /**When the record was last updated*/ updatedAt: {
    Type: Scalars['unixTimestamp'] | null
    Args: undefined
  }
  createdBy: { Type: User; Args: undefined }
}
/**Link type*/ export type SubmissionCharacterParticipantLink = {
  /**The unique ID of the field*/ id: { Type: Scalars['id']; Args: undefined }
  /**The typename of the record*/ __typename: {
    Type: Scalars['string']
    Args: [Scalars['number']]
  }
  submission: { Type: Submission; Args: undefined }
  character: { Type: Character; Args: undefined }
  title: { Type: Scalars['string'] | null; Args: undefined }
  /**When the record was created*/ createdAt: {
    Type: Scalars['unixTimestamp']
    Args: undefined
  }
  /**When the record was last updated*/ updatedAt: {
    Type: Scalars['unixTimestamp'] | null
    Args: undefined
  }
  createdBy: { Type: User; Args: undefined }
}
/**All Root resolvers*/ export type Root = {
  getUserRoleEnumPaginator: { Type: UserRoleEnumPaginator; Args: undefined }
  getSubmissionStatusEnumPaginator: {
    Type: SubmissionStatusEnumPaginator
    Args: undefined
  }
  getCurrentUser: { Type: User; Args: undefined }
  syncCurrentUser: { Type: User; Args: InputTypes['syncCurrentUser'] }
  getUser: { Type: User; Args: InputTypes['user'] }
  getUserPaginator: { Type: UserPaginator; Args: InputTypes['userPaginator'] }
  deleteUser: { Type: User; Args: InputTypes['user'] }
  createUser: { Type: User; Args: InputTypes['createUser'] }
  updateUser: { Type: User; Args: InputTypes['updateUser'] }
  getApiKey: { Type: ApiKey; Args: InputTypes['apiKey'] }
  getApiKeyPaginator: {
    Type: ApiKeyPaginator
    Args: InputTypes['apiKeyPaginator']
  }
  deleteApiKey: { Type: ApiKey; Args: InputTypes['apiKey'] }
  createApiKey: { Type: ApiKey; Args: InputTypes['createApiKey'] }
  updateApiKey: { Type: ApiKey; Args: InputTypes['updateApiKey'] }
  getEra: { Type: Era; Args: InputTypes['era'] }
  getEraPaginator: { Type: EraPaginator; Args: InputTypes['eraPaginator'] }
  deleteEra: { Type: Era; Args: InputTypes['era'] }
  createEra: { Type: Era; Args: InputTypes['createEra'] }
  updateEra: { Type: Era; Args: InputTypes['updateEra'] }
  getEventClass: { Type: EventClass; Args: InputTypes['eventClass'] }
  getEventClassPaginator: {
    Type: EventClassPaginator
    Args: InputTypes['eventClassPaginator']
  }
  deleteEventClass: { Type: EventClass; Args: InputTypes['eventClass'] }
  createEventClass: { Type: EventClass; Args: InputTypes['createEventClass'] }
  updateEventClass: { Type: EventClass; Args: InputTypes['updateEventClass'] }
  getEvent: { Type: Event; Args: InputTypes['event'] }
  getEventPaginator: {
    Type: EventPaginator
    Args: InputTypes['eventPaginator']
  }
  deleteEvent: { Type: Event; Args: InputTypes['event'] }
  createEvent: { Type: Event; Args: InputTypes['createEvent'] }
  updateEvent: { Type: Event; Args: InputTypes['updateEvent'] }
  getSubmission: { Type: Submission; Args: InputTypes['submission'] }
  getSubmissionPaginator: {
    Type: SubmissionPaginator
    Args: InputTypes['submissionPaginator']
  }
  deleteSubmission: { Type: Submission; Args: InputTypes['submission'] }
  createSubmission: { Type: Submission; Args: InputTypes['createSubmission'] }
  updateSubmission: { Type: Submission; Args: InputTypes['updateSubmission'] }
  getCharacter: { Type: Character; Args: InputTypes['character'] }
  getCharacterPaginator: {
    Type: CharacterPaginator
    Args: InputTypes['characterPaginator']
  }
  deleteCharacter: { Type: Character; Args: InputTypes['character'] }
  createCharacter: { Type: Character; Args: InputTypes['createCharacter'] }
  updateCharacter: { Type: Character; Args: InputTypes['updateCharacter'] }
  getRepositoryReleases: {
    Type: Scalars['unknown'][]
    Args: InputTypes['getRepositoryReleases']
  }
  getRepositoryLatestVersion: {
    Type: Scalars['unknown'] | null
    Args: undefined
  }
  getFile: { Type: File; Args: InputTypes['file'] }
  getFilePaginator: { Type: FilePaginator; Args: InputTypes['filePaginator'] }
  deleteFile: { Type: File; Args: InputTypes['file'] }
  createFile: { Type: File; Args: InputTypes['createFile'] }
  updateFile: { Type: File; Args: InputTypes['updateFile'] }
  getSubmissionCharacterParticipantLink: {
    Type: SubmissionCharacterParticipantLink
    Args: InputTypes['submissionCharacterParticipantLink']
  }
  getSubmissionCharacterParticipantLinkPaginator: {
    Type: SubmissionCharacterParticipantLinkPaginator
    Args: InputTypes['submissionCharacterParticipantLinkPaginator']
  }
  updateSubmissionCharacterParticipantLink: {
    Type: SubmissionCharacterParticipantLink
    Args: InputTypes['updateSubmissionCharacterParticipantLink']
  }
  deleteSubmissionCharacterParticipantLink: {
    Type: SubmissionCharacterParticipantLink
    Args: InputTypes['submissionCharacterParticipantLink']
  }
  createSubmissionCharacterParticipantLink: {
    Type: SubmissionCharacterParticipantLink
    Args: InputTypes['createSubmissionCharacterParticipantLink']
  }
}

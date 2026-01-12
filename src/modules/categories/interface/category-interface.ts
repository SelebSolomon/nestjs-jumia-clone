export interface GetCategoriesParams {
  page?: number;
  limit?: number;
  sort?: string;
  fields?: string;
  search?: string;
  parent?: string;
}

export interface GetCategoryParams {
  id: string;
  fields?: string;
  includeChildren?: boolean;
}

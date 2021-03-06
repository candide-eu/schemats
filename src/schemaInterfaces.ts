import Options from "./options"

export interface ColumnDefinition {
  udtName: string
  nullable: boolean
  hasDefault: boolean
  outputTsType?: string
  inputTsType?: string
}

export interface TableDefinition {
  [columnName: string]: ColumnDefinition
}

export interface Database {
  connectionString: string
  query(queryString: string): Promise<Array<object>>
  getDefaultSchema(): string
  getEnumTypes(schema?: string): any
  getTableDefinition(
    tableName: string,
    tableSchema: string,
  ): Promise<TableDefinition>
  getTableTypes(
    tableName: string,
    tableSchema: string,
  ): Promise<TableDefinition>
  getSchemaTables(schemaName: string): Promise<Array<string>>
}

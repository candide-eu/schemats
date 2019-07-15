/**
 * Schemats takes sql database schema and creates corresponding typescript definitions
 * Created by xiamx on 2016-08-10.
 */

import {
  generateEnumType,
  generateTableInterface,
  generateTableInputInterface,
  generateTableList,
} from "./typescript"
import {getDatabase, Database} from "./schema"
import Options, {OptionValues} from "./options"
import {processString, Options as ITFOptions} from "typescript-formatter"

function getTime() {
  const padTime = (value: number) => `0${value}`.slice(-2)
  const time = new Date()
  const yyyy = time.getFullYear()
  const MM = padTime(time.getMonth() + 1)
  const dd = padTime(time.getDate())
  const hh = padTime(time.getHours())
  const mm = padTime(time.getMinutes())
  const ss = padTime(time.getSeconds())
  return `${yyyy}-${MM}-${dd} ${hh}:${mm}:${ss}`
}

function buildHeader(
  db: Database,
  tables: Array<string>,
  schema: string | null,
): string {
  const commands = [
    "schemats",
    "generate",
    "-c",
    db.connectionString.replace(/:\/\/.*@/, "://username:password@"),
  ]
  if (tables.length > 0) {
    tables.forEach((t: string) => {
      commands.push("-t", t)
    })
  }
  if (schema) {
    commands.push("-s", schema)
  }

  return `
        /**
         * AUTO-GENERATED FILE @ ${getTime()} - DO NOT EDIT!
         *
         * This file was automatically generated by schemats
         * $ ${commands.join(" ")}
         *
         */

    `
}

export async function typescriptOfTable(
  db: Database | string,
  table: string,
  schema: string,
) {
  if (typeof db === "string") {
    db = getDatabase(db)
  }

  let interfaces = ""
  const tableTypes = await db.getTableTypes(table, schema)
  interfaces += generateTableInterface(table, tableTypes)
  interfaces += generateTableInputInterface(table, tableTypes)
  return interfaces
}

const fixtures = ["export type DateInput = Date | string", "\n"].join("\n")

export async function typescriptOfSchema(
  db: Database | string,
  tables: Array<string> = [],
  schema: string | null = null,
  options: OptionValues = {},
): Promise<string> {
  if (typeof db === "string") {
    db = getDatabase(db)
  }

  if (!schema) {
    schema = db.getDefaultSchema()
  }

  if (tables.length === 0) {
    tables = await db.getSchemaTables(schema)
  }

  const optionsObject = new Options(options)

  const enumTypes = generateEnumType(await db.getEnumTypes(schema))
  const interfacePromises = tables.map(table =>
    typescriptOfTable(db, table, schema as string),
  )
  const interfaces = await Promise.all(interfacePromises).then(tsOfTable =>
    tsOfTable.join(""),
  )

  let output = ""
  if (optionsObject.options.writeHeader) {
    output += buildHeader(db, tables, schema)
  }

  output += fixtures
  output += enumTypes
  output += interfaces
  output += "\n\n"
  output += generateTableList(tables)

  const formatterOption: ITFOptions = {
    replace: false,
    verify: false,
    tsconfig: true,
    tslint: true,
    editorconfig: true,
    tsfmt: true,
    vscode: false,
    tsconfigFile: null,
    tslintFile: null,
    vscodeFile: null,
    tsfmtFile: null,
  }

  const processedResult = await processString(
    "schema.ts",
    output,
    formatterOption,
  )
  return processedResult.dest
}

export {Database, getDatabase} from "./schema"
export {Options, OptionValues}

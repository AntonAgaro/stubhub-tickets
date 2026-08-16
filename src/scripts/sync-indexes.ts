import { createConnection } from 'mongoose';

import { loadConfig } from '../config/config.js';
import { createNoteModel } from '../modules/notes/note.model.js';

const config = loadConfig();
const connection = await createConnection(config.mongodbUri, { autoIndex: false }).asPromise();

try {
  const noteModel = createNoteModel(connection);
  const changes = await noteModel.syncIndexes();
  process.stdout.write(`${JSON.stringify({ model: noteModel.modelName, droppedIndexes: changes })}\n`);
} finally {
  await connection.close();
}

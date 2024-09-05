import { JSONFilePreset } from 'lowdb/node';
import { Low } from 'lowdb/lib';

type MovieDBType = {
    [key: string]: boolean[]
};

// Read or create db.json
const defaultData = {};
const dbPromise: Promise<Low<{}>> = JSONFilePreset('db.json', defaultData);

export default dbPromise;
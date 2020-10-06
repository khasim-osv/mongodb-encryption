const crypto = require("crypto");
const { MongoClient } = require("mongodb");
const { ClientEncryption } = require("mongodb-client-encryption");
const fs = require("fs");

const keyVaultNamespace = "encryption.__keyVault";

let localMasterKey = fs.readFileSync("./masterKey.txt");

//generate, if master key not present
/*async function generateMasterKey() {
  try {
    const key = crypto.randomBytes(96);
    await fs.writeFileSync("masterKey.txt", key);
    await fs.writeFileSync("masterKeyBase64.txt", key.toString("base64"));
  } catch (err) {
    throw err;
  }
}
generateMasterKey();*/
//End here

const kmsProviders = { local: { key: localMasterKey } };

const URL = "mongodb://localhost:27017";

main();

async function main() {
  const client = new MongoClient(URL, { useUnifiedTopology: true });
  try {
    await client.connect();
    const clientEncryption = new ClientEncryption(client, {
      kmsProviders,
      keyVaultNamespace,
    });

    const dataKeyId = await clientEncryption.createDataKey("local");

    const dbName = "osv";
    const collName = "test";

    const schemaMap = {
      [`${dbName}.${collName}`]: {
        bsonType: "object",
        encryptMetadata: {
          keyId: [dataKeyId],
        },
        properties: {
          userName: {
            encrypt: {
              bsonType: "string",
              algorithm: "AEAD_AES_256_CBC_HMAC_SHA_512-Deterministic",
            },
          },
          password: {
            encrypt: {
              bsonType: "string",
              algorithm: "AEAD_AES_256_CBC_HMAC_SHA_512-Deterministic",
            },
          },
        },
      },
    };

    const encryptedClient = new MongoClient(URL, {
      useUnifiedTopology: true,
      autoEncryption: {
        keyVaultNamespace,
        kmsProviders,
        schemaMap,
      },
    });

    try {
      await encryptedClient.connect();
      const db = encryptedClient.db("osv");
      const collection = db.collection("test");
      //insert data
      await collection.insertOne({
        name: "Khasim Ali",
        userName: "ali@onesingleview.com",
        password: "12345kK$",
      });
      //fetch data
      const data = await collection.find().toArray();
      //Find records
      /*const data = await collection
        .find({ userName: "ali@onesingleview.com" })
        .toArray();*/
      console.log(data);
    } finally {
      await encryptedClient.close();
    }
  } finally {
    await client.close();
  }
}

localMasterKey = cat("masterKeyBase64.txt");
print(localMasterKey);

var ClientSideFieldLevelEncryptionOptions = {
  keyVaultNamespace: "encryption.__keyVault",
  kmsProviders: {
    local: {
      key: BinData(0, localMasterKey),
    },
  },
  schemaMap: {
    "osv.test": {
      bsonType: "object",
      encryptMetadata: {
        keyId: [UUID()],
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
  },
};

var cluster = Mongo(
  "mongodb://localhost:27017/osv",
  ClientSideFieldLevelEncryptionOptions
);

// returns the database object
myDB = cluster.getDB("osv");

// returns the collection object
myColl = myDB.getCollection("test");

print(JSON.stringify(myColl.findOne({ name: "Khasim Ali" })));

// returns object for managing data encryption keys
//keyVault = cluster.getKeyVault();

// returns object for explicit encryption/decryption
//clientEncryption = cluster.getClientEncryption();

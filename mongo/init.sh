#/bin/bash
set -e

mongo <<EOF
use admin
db.createUser(
  {
    user: "$MONGO_API_USER",
    pwd: "$MONGO_API_PASS",
    roles: [
      {
        role: "readWrite",
        db: "gatsby"
      }
    ]
  }
)
EOF

To run the backend server:

```bash
deno run --allow-net --allow-env main.ts
```

Run the MySQL server locally:
- Windows:
    - Use task manager to start the MySQL instance(MySQL Chris)
    - then you can access the database using workbench or any other MySQL client
    - password is 'chris'
    - If you modify the scheme, you need to re-run the query to create the database

How to run the tests:
```bash
deno test --allow-net api/tests/order.test.ts
```

- When modifying the APIs, run the tests to ensure they work as expected.
- Also, you need to re-start the server after modifying the APIs, otherwise the changes won't take effect.

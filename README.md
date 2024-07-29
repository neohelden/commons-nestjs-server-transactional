# neohelden-commons-nestjs-server-transactional

This module provides a database-agnostic transactional service for NestJS applications.
The transactional service is build in a way, that any underlying database or transaction-supporting service can be used.


## Transaction Bundle

The decisions are available to the Application using decorators. 
An example for OPA enabled decision is: 

```typescript

```

## Configuration 

The configuration of this module is accomplished using NestJS Dynamic modules. 
Therefore import the `AuthModule` in your `AppModule` and provide the configuration.

Example: 

```typescript
AuthModule.forRootAsync({
  isGlobal: true,
  useFactory: async (configService: ConfigService) => {
    console.log("Using factory");
    return {
      opa: {
        disableOpa: configService.get<string>("opa.disable") === "true",
        baseUrl: configService.get<string>("opa.url"),
        policyPackage: configService.get<string>("opa.package"),
        opaClient: {
          timeout: configService.get<number>("opa.opaClient.timeout"),
        },
      },
      auth: {
        disableAuth: configService.getOrThrow<string>("auth.disableAuth") === "true",
        authIssuers: configService
          .get<string>("auth.issuers")
          ?.trim()
          .split(","),
        authKeys: configService.get("auth.keys"),
      },
    } as AuthModuleOptions;
  },
  inject: [ConfigService],
  imports: [ConfigModule],
}),
```


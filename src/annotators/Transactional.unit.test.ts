import { Injectable } from "@nestjs/common";
import { DataManager } from "../model/DataManager";
import { TransactionHelper } from "../model/TransactionHelper";
import { Transactional } from "./Transactional";
import { Test } from "@nestjs/testing";
import { beforeEach, describe, expect, it, jest } from "@jest/globals";

@Injectable()
class DecoratedMock {
  @Transactional()
  public value(): Promise<void> {
    return Promise.resolve();
  }

  @Transactional({ timings: true })
  public async valueIndirect(): Promise<void> {
    return this.value();
  }

  @Transactional()
  public async valueThrow(): Promise<void> {
    throw new Error("ERR");
  }
}

describe("transactional", () => {
  let transactionHelper: jest.Mocked<
    Pick<TransactionHelper<DataManager>, keyof TransactionHelper>
  >;
  let mock: DecoratedMock;

  beforeEach(async () => {
    transactionHelper = {
      getStoredManager: jest.fn(),
      transaction: jest.fn<(a: never) => Promise<never>>(),
    };

    const module = await Test.createTestingModule({
      providers: [TransactionHelper, DecoratedMock],
    })
      .overrideProvider(TransactionHelper)
      .useValue(transactionHelper)
      .compile();

    const mod = await module.createNestApplication();
    mock = await mod.get(DecoratedMock);
  });

  it("should call transaction when manager is undefined", async () => {
    transactionHelper.transaction.mockResolvedValue(undefined);
    transactionHelper.getStoredManager.mockReturnValue(undefined);

    mock.value();

    expect(transactionHelper.transaction).toHaveBeenCalledTimes(1);
  });

  it("should not call transaction when manager is defined", async () => {
    transactionHelper.transaction.mockResolvedValue(undefined);
    transactionHelper.getStoredManager.mockReturnValue({} as DataManager);

    mock.value();

    expect(transactionHelper.transaction).toHaveBeenCalledTimes(0);
  });

  it("should call transaction when manager is undefined in indirect call", async () => {
    transactionHelper.transaction.mockResolvedValue(undefined);
    transactionHelper.getStoredManager.mockReturnValue(undefined);

    mock.valueIndirect();

    expect(transactionHelper.transaction).toHaveBeenCalledTimes(1);
  });

  it("should throw when helper emits an error", async () => {
    transactionHelper.transaction.mockRejectedValue("ERR");
    transactionHelper.getStoredManager.mockReturnValue(undefined);

    await expect(mock.value()).rejects.toBe("ERR");
  });

  it("should propagate throws when manager is defined", async () => {
    transactionHelper.getStoredManager.mockReturnValue({} as DataManager);

    await expect(mock.valueThrow()).rejects.toThrow("ERR");
  });
});

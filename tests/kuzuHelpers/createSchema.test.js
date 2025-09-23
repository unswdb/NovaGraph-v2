// import controller from '../src/MainController.ts'
import controller from '../../src/MainController.ts';

controller.initKuzu();

test("query returns expected result", () => {
    expect(controller.db.createSchema()).toBe(3);
});

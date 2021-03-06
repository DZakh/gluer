# Gluer

Safely glues **pure JavaScript** code having developer experience top-notch.

## Why?

The package exists to solve two problems that I encounter every day while developing a **pure JavaScript** application with a very thick frontend. Mostly for the logic part, which strictly follows SOLID principles, so the package can easily be used for the backend as well.

### Problem 1: Rotten mocks

Integration tests are a rare guest in our application. Because of the complex logic in most cases it is simply too difficult to write even a simple test case. Not to mention their fragility. So we mostly write unit tests and a bit of e2e, which covers basic user scenarios.

With unit tests, non-testable functionality is covered with mocks, which allows you to test the logic you want, avoiding the fragility of the test. But in **pure JavaScript** it can easily happen that the implementation has changed, but the mock forgot to be corrected - the tests pass successfully, but the code does not work.

### Problem 2: Dependency inversion principle

When you design a complex application with a long lifespan, you have to lay down some kind of architecture. In our case, the Clean architecture was a good fit. But the Dependency inversion principle in **pure JavaScript** looked dumb, because you can only invert dependencies to nothingless, and it is the engineer's responsibility to make sure that the correct dependencies are provided when building the application.

## - Dude, just use TypeScript!

_\- Yes, yes, thank you for the advice..._

But seriously, if you are already actively using TypeScript and don't have any problems with it, go ahead. The problems mentioned above are perfectly solved by it, and this package will only add more overhead.

For all other users, I won't argue whether you should use TS or something else, it's up to your team to decide. But if you do decide to use this package, you will get a few goodies that TS does not have:

- Run-time type checks in dev-mode
- Performance marks for your logic

## TODO: Opinionated architecture decisions

### TODO: Error handling

### TODO: One method per interface

## TODO: Recipes

TODO: Default setup

### TODO: Recipe: Clean architecture

### TODO: Recipe: Run-time free mode

### TODO: Recipe: With redux-saga

### TODO: Recipe: Contracts for regular functions

### TODO: Recipe: Reliable mocks

## TODO: api

## TODO: Useful tools (wallaby)

## Roadmap to v1

- [ ] Add d.ts for the package api
- [ ] Validate implFn return value
- [ ] Support implFn return value validation for async functions
- [ ] Support implFn return value validation for generators (redux-saga specifically)
- [ ] Track unhandled errors during return value validation
- [ ] Add performance profiler mode
- [ ] Properly test the whole package
- [ ] Use the package to test itself, to showcase the run-time free mode
- [ ] Prevent creating interfaces with dublicated names
- [ ] Finish the docs
- [ ] Add inline interfaces
- [ ] Add fixtures factory utility

## Contributions are welcome

There is some functionality that does not contradict the philosophy of the package, but since we don't have such usecases, they were not implemented.

For example:

- Using classes for the implementation factory
- Asynchronous implementation factory
- Generic traits like in rust with &self and impl for

Feel free to create an issue if you need something more.

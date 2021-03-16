![MicroLib](https://github.com/tysonrm/MicroLib/blob/master/wiki/microlib.png)

# MicroLib  <sub><sup>codename _Aegis_</sup></sub>

Microservice Libraries

## Purpose

Enjoy the benefits of deployment independence without the hassle of a distributed architecture. Microservice-style architectures, like any architecture, impose several trade-offs, chief among which, is the decision to support deployment independence with distributed components. While deployment independence is tantamount to agility and velocity, distribution adds significant cost and risk. Many projects get into to trouble. This barrier to entry is known as the "microservices premium."

The implicit premise behind this trade-off is expressed by [Fowler](https://martinfowler.com/articles/microservices.html):

> "One main reason for using services as components (rather than libraries) is that services are independently deployable. If you have an application that consists of multiple libraries in a single process, a change to any single component results in having to redeploy the entire application.”

While there are, and have been, technologies to deploy libraries without redeploying the applications they comprise (consider [OSGi](https://www.osgi.org/)), it seems the benefits of these technologies have not been worth the effort required to implement them. At least not until now...

With the introduction of module federation, it is possible to dynamically import remote libraries, just as if they were installed locally, with only a few, simple configuration steps. MicroLib exploits this technology to support a framework for building application components as independently deployable libraries, running in the same process, or what might be loosely called, **microservice libraries**. 

With MicroLib, then, you are no longer forced to choose between mangeability and autonomy. Rather, you avoid the microservices premium by building "microservice monoliths." And although these libraries run in the same process, MicroLib's port-adapter design and _zero-downtime_ / _"zero-install"_ deployment capability, ensure they can be deployed independently of one another, at the discretion of the responsible developement team, with no futher coordination or agreement outside that team required.

---

## Features

The goal of MicroLib is to provide an alternative to distributed systems and the performance and operational challenges that come with them, while preserving the benefits of deployment independence. To this end, MicroLib organizes components according to hexagonal architecture, such that the boundaries of, and relations between, federated components are clear and useful. In addtion to zero-install, hot deployment and built-in eventing, MicroLib promotes strong boundaries between, and prevents coupling of, collocated components through the formalism of the port-adapter paradigm and the use of code generation to automate boilerplate integration tasks. Features include:

- [Dynamic API generation for federated modules](#zero-downtime---zero-install-deployment-api-generation)
- Dynamic, independent persistence of federated modules
- Dynamic port generation for federated modules
- Dynamic port-adapter binding
- Dynamic adapter-service binding
- Configuration-based service integration
- Configuration-based service orchestration
- Common broker for locally shared events
- Persistence API for cached datasources
- Datasource relations for federated schemas
- Dependency/control inversion (IoC)
- [Zero downtime, "zero install" deployment](#zero-downtime---zero-install-deployment-api-generation)
- Evergreen deployment and semantic versioning
- Dynamic A/B testing
- Serverless deployment
- Configurable serialization for network and storage I/O
- Code reuse that works with multiple repos

---

![Components](https://github.com/tysonrm/MicroLib/blob/master/wiki/port-adapter.png)

## Components

MicroLib uses a modified version of [Webpack Module Federation](https://webpack.js.org/concepts/module-federation/) to import remote modules over the network into the host framework at runtime.
MicroLib modules fall into three categories: `model`, `adapter` and `service`.

A `model` is a domain entity/service that implements all or part of the service’s core logic. It also implements the MicroLib `ModelSpecification` interface. The interface has many options but only a few simple requirements, so developers can use as much, or as little, of the framework's capabilities as they choose.

One such capability is port generation. In a hexagonal or port-adapter architecture, ports handle I/O between the application and domain layers. An `adapter` implements the port ’s interface, facilitating communication with the outside world. The framework dynamically imports and binds adapters to ports at runtime.

A `service` provides an optional layer of abstraction for adapters and usually implements a client library. When an adapter is written to satisfy a common integration pattern, a service implements a particular instance of that pattern. Like adapters to ports, the framework dynamically imports and binds services to adapters at runtime.

---

![Persistence](https://github.com/tysonrm/MicroLib/blob/master/wiki/persistence.png)

## Persistence

The framework automatically persists domain models as JSON documents using the default adapter configured for the server. In-memory, filesystem, and MongoDB adapters are provided. Adapters can be extended and individualized per model. Additionally, de/serialization can be customized. Finally, every write operation generates an event that can be forwarded to an external event or data source.

A common datasource factory manages adapters and provides access to each service’s individual datasource. The factory supports federated schemas (think GraphQL) through relations defined between datasources in the _ModelSpec_. Apart from this, services cannot access one another’s data. Queries execute against an in-memory copy of the data. Datasources leverage this cache by extending the in-memory adapter.

---

![Eventing](https://github.com/tysonrm/MicroLib/blob/master/wiki/eventing.png)

## Integration

### Ports & Adapters

When ports are configured in the _ModelSpecification_, the framework dynamically generates methods on the domain model to invoke them. Each port is assigned an adapter, which either invokes the port (inbound) or is invoked by it (outbound).

Ports can be instrumented for exceptions and timeouts to extend the framework’s retry and compensation logic.
They can also be piped together in control flows by specifying the output event of one port as the input or triggering event of another.

An adapter either implements an external interface or exposes an interface for external clients to consume.
On the port side, an adapter always implements the port interface; never the other way around. Ports are a function of the domain logic, which is orthogonal to external or environmental aspects, like I/O protocols.

Ports optionally specify a callback to process data received on the port before control is returned to the caller. The callback is passed as an argument to the port function. Ports can be configured to run on receipt of an event, API request, or called directly from code.

Ports also have an undo callback for implementing compensating logic. The framework remembers the order in which ports are invoked and runs the undo callback of each port in reverse order, starting at the point of failure. This allows transactions across multiple services to be rolled back.

### Local & Remote Events

In addition to in-memory function calls and ports, services can communicate with one another locally the same way they do remotely: by publishing and subscribing to events. Using locally shared events, microservice libraries are virtually as decoupled as they would be running remotely.

The framework provides a common broker for inter-service events and injects pub/sub functions into each model:

    ModelA.listen(event, callback)

    ModelB.notify(event, data)

As for remote events, just like any external integration, ports must be configured for external event sources/sinks. Adapters are provided for **Kafka** and **WebSockets**.

---

![Workflow](https://github.com/tysonrm/MicroLib/blob/master/wiki/workflow.png)

## Orchestration

Service orchestration is built on the framework’s port-adapter implementation. As mentioned, ports both produce and consume events, allowing them to be piped together in control flows by specifying the output event of one port as the input event of another. Because events are shared internally and can be forwarded externally, this implementation works equally well whether services are local or remote.

Callbacks specified for ports in the _ModelSpec_ can process data received on a port before its output event is fired and the next port runs. If not specified, the framework nevertheless saves the port output to the model. Of course, you can implement your own event handlers or adapter logic to customize the flow.

---
## Running the Application

Installation of Kafka is currently required to demo the sample app. Check back soon for a simplified install. Otherwise, [download](https://kafka.apache.org/downloads) the kafka tarball and extract it to the same dir MicroLib is in. 

After cloning the two MicroLib repos, your directory structure should look like this (your kafka version might be different):

```shell
ls -l
drwxr-xr-x  21 tmidboe  staff  672 Mar 15 09:12 MicroLib
drwxr-xr-x  21 tmidboe  staff  672 Mar 14 00:47 MicroLib-Example
drwxr-xr-x   1 tmidboe  staff   19 Mar  3 17:44 kafka_2.13-2.6.0
```

```shell
git clone https://github.com/module-federation/MicroLib-Example.git
cd *Example
npm ci
echo "KAFKA_GROUP_ID=remote" > .env
echo "ENCRYPTION_PWD=secret" >> .env
npm run build
npm run start-all
```

```shell
git clone https://github.com/module-federation/MicroLib.git
cd MicroLib
npm ci
echo "KAFKA_GROUP_ID=host" > .env
echo "ENCRYPTION_PWD=secret" >> .env
echo "DATASOURCE_ADAPTER=DataSourceFile" >> .env
npm run restart
```

Optionally, install MongoDB:

```shell
brew install mongodb-community@4.4
mongod
```

.env

```shell
DATASOURCE_ADAPTER=DataSourceMongoDb
MONGODB_URL=mongodb://localhost:27017
```

### Installation
![install](https://github.com/module-federation/MicroLib/blob/master/wiki/microlib-install-4k.gif)

### Zero Downtime - Zero Install Deployment, API Generation
![hotreload](https://github.com/module-federation/MicroLib/blob/master/wiki/hot-reload.gif)

---
## Further Reading

[Clean Micoservices: Building Composable Microservices with Module Federation](https://trmidboe.medium.com/clean-microservices-building-composable-microservices-with-module-federation-f1d2b03d2b27)

[Webpack 5 Module Federation: A game-changer in JavaScript architecture](https://medium.com/swlh/webpack-5-module-federation-a-game-changer-to-javascript-architecture-bcdd30e02669)

[Microservice trade-offs](https://martinfowler.com/articles/microservice-trade-offs.html)

<img src="https://ssl.google-analytics.com/collect?v=1&t=event&ec=email&ea=open&t=event&tid=UA-120967034-1&z=1589682154&cid=ae045149-9d17-0367-bbb0-11c41d92b411&dt=MicroLIb&dp=/email/MicroLib">



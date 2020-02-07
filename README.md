# Digital Land Map

A map showing the data collected by Digital Land

## Sources
The map currently uses the following sources:

- [brownfield-land-collection](https://github.com/digital-land/brownfield-land-collection)
- [organisation-collection](https://github.com/digital-land/organisation-collection)

## Generating the map

You need [Node >=10](https://nodejs.org) and [npm](https://npmjs.com).

Run the following:

```
git clone https://github.com/digital-land/map --recursive
cd map
npm install
npm run compile
```

## Updating submodules
The sources are held as submodules. To update them, run:

```
npm run refresh
```

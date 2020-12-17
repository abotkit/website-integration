const injectOnChange = (id, htmlString, method) => htmlString.replace(`id="${id}"`, `onChange="${method.toString()}" id="${id}"`);

export { injectOnChange };
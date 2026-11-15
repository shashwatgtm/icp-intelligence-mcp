// Edit only fields the existing tool accepts. Every result comes from a host tool call.
function createResultEditor(panel, config, bridge) {
  const form = panel.querySelector('form');
  const fields = panel.querySelector('[data-fields]');
  const status = panel.querySelector('[role=status]');
  const run = panel.querySelector('[data-run]');
  let owned = false;
  let revision = 0;
  let requestNumber = 0;
  let original = {};
  let busy = false;
  const controls = new Map();
  const element = (tag, text) => {
    const node = document.createElement(tag);
    if (text !== undefined) node.textContent = text;
    return node;
  };
  function markEdit() {
    owned = true;
    revision++;
    busy = false;
    run.disabled = !bridge.available();
    status.textContent = 'Inputs changed. Run the tool to update the result.';
  }
  function field(key, spec, required) {
    const label = element('label', spec.label);
    let input;
    if (spec.choices) {
      input = element('select');
      input.append(element('option', ''));
      for (const choice of spec.choices) {
        const option = element('option', choice.replaceAll('_', ' '));
        option.value = choice;
        input.append(option);
      }
    } else if (spec.type === 'number') {
      input = element('input');
      input.type = 'number';
      input.step = 'any';
      if (spec.min !== undefined) input.min = String(spec.min);
      if (spec.max !== undefined) input.max = String(spec.max);
    } else {
      input = element('textarea');
      input.rows = spec.long ? 4 : 2;
    }
    input.name = key;
    input.required = required;
    label.append(input);
    return {
      node: label,
      set(value) { input.value = value == null ? '' : spec.list ? value.join('\n') : String(value); },
      get() {
        if (!input.value.trim()) return undefined;
        if (spec.type === 'number') return Number(input.value);
        return spec.list ? input.value.split('\n').map(v => v.trim()).filter(Boolean) : input.value;
      }
    };
  }
  for (const [key, spec] of Object.entries(config.fields)) {
    const input = field(key, spec, config.required.includes(key));
    controls.set(key, input);
    fields.append(input.node);
  }
  function populate(args) {
    for (const [key, input] of controls) input.set(args?.[key]);
  }
  form.addEventListener('input', markEdit);
  async function runTool(event) {
    event.preventDefault();
    if (busy || !bridge.available() || (form.reportValidity && !form.reportValidity())) return;
    const args = {};
    for (const [key, control] of controls) {
      const value = control.get();
      const spec = config.fields[key];
      if (value === undefined && config.required.includes(key)) {
        status.textContent = 'Enter ' + spec.label.toLowerCase() + '.';
        return;
      }
      if (value !== undefined && spec.type === 'number' &&
          (!Number.isFinite(value) || value < spec.min || value > spec.max || value <= spec.exclusiveMin)) {
        status.textContent = 'Check the value for ' + spec.label.toLowerCase() + '.';
        return;
      }
      if (value !== undefined) args[key] = value;
    }
    const current = ++requestNumber;
    const atRevision = revision;
    owned = true;
    busy = true;
    run.disabled = true;
    status.textContent = 'Waiting for the server result.';
    try {
      const result = await bridge.call(config.tool, args);
      if (current !== requestNumber || atRevision !== revision) return;
        bridge.render(result);
      if (result?.isError) {
        status.textContent = 'The server asked for corrected inputs. Read the response before trying again.';
      } else {
        original = args;
        status.textContent = 'Result updated from the server.';
      }
    } catch {
      if (current === requestNumber && atRevision === revision) status.textContent = 'The host could not complete the call. Your inputs are still here.';
    } finally {
      if (current === requestNumber && atRevision === revision) {
        busy = false;
        run.disabled = !bridge.available();
      }
    }
  }
  // A sandboxed component can run scripts even when its host disables native form submissions.
  run.addEventListener('click', runTool);
  form.addEventListener('submit', runTool);

  panel.querySelector('[data-reset]').addEventListener('click', () => {
    revision++;
    requestNumber++;
    owned = false;
    busy = false;
    populate(original);
    run.disabled = !bridge.available();
    status.textContent = 'Inputs restored to the last accepted values.';
  });
  function sync() {
    run.disabled = busy || !bridge.available();
    if (!owned) status.textContent = run.disabled ? 'This host can show the result. Use the conversation to run the tool.' : '';
  }
  sync();
  return {
    sync,
    acceptInput(args) { if (owned) return false; original = args ?? {}; populate(original); return true; },
    acceptResult() {
      if (owned) status.textContent = 'A host update arrived. Your local edits were kept.';
      return !owned;
    },
    close() { revision++; requestNumber++; busy = false; owned = false; run.disabled = true; }
  };
}

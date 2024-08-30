import React, { useState } from 'react';

import FormControl from '@mui/material/FormControl';
import FormControlLabel from '@mui/material/FormControlLabel';
import InputLabel from '@mui/material/InputLabel';
import TextField from '@mui/material/TextField';
import Checkbox from '@mui/material/Checkbox';
import Select, { SelectChangeEvent } from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import InputAdornment from '@mui/material/InputAdornment';
import IconButton from '@mui/material/IconButton';
import ContentCopyIcon from '@mui/icons-material/ContentCopyOutlined';

const rounddown = (v: number) => (v >> 0)
const calc = (quest: number, ceBonus: number, useHeroicPortrait: boolean, eventBonus: number, isStartup: boolean, isStartupSupport: boolean, useTeapot: boolean) : number => {
  const startup = isStartup ? 0.2 : 0
  const startupSupport = isStartupSupport ? 0.04 : 0
  const ceFixedBonus = useHeroicPortrait ? 50 : 0
  const teapot = useTeapot ? 2 : 1
  return rounddown(rounddown(quest * ( 1 + startup + startupSupport)) * (1 + ceBonus + eventBonus) + ceFixedBonus) * teapot
}

const directInputKey = "直接入力"
const questLevelAndBondTemplate = {
  [directInputKey]: 9999,
  "90★★(オーディールコール)": 3797,
  "90★(オーディールコール)": 3164,
  "90++(オーディールコール)": 2636,
  "90++": 1318,
  "90+": 1098
}

type FormValues = {
  questBond: number,
  ceBonus: number,
  eventBonus: number,
  useCeFixedBonus: boolean,
  isStartUpBonus: boolean,
  isStartUpSupportBonus: boolean,
  useTeaPot: boolean
}

const defaultFormValues: FormValues = { questBond: 0, ceBonus: 0, eventBonus: 0, useCeFixedBonus: false, isStartUpBonus: false, isStartUpSupportBonus: false, useTeaPot: false }
const storage = {
  formValues: () : FormValues => JSON.parse(localStorage.getItem('QuestBondCalculator/formValues') || JSON.stringify(defaultFormValues)),
  saveFormValues: (values: FormValues) => localStorage.setItem('QuestBondCalculator/formValues', JSON.stringify(values))
}

const questLevelAndBonds : { level: string, bond: number }[] = Object.entries(questLevelAndBondTemplate).map(([level, bond]) => ({ level, bond }))
for (let level = 90; level >= 70; level--) {
  const bond = level * 10 + 15
  questLevelAndBonds.push( { level: level.toString(), bond } )
}

function QuestBondCalculator() {
  const calcBondPoint = (formValues: FormValues) => {
    return calc(
      formValues.questBond,
      formValues.ceBonus,
      formValues.useCeFixedBonus,
      formValues.eventBonus,
      formValues.isStartUpBonus,
      formValues.isStartUpSupportBonus,
      formValues.useTeaPot
    )
  }
  const formatBondPoint = (formValues: FormValues) => {
    const baseBond = formValues.questBond
    const result = calcBondPoint(formValues)
    return `${baseBond}(${result - baseBond}) = ${result}`
  } 

  const [ formValues, setFormValues ] = useState(storage.formValues())
  const questLevel = questLevelAndBonds.find((v) => v.bond === formValues.questBond)?.level || directInputKey
  const bondPoint = formatBondPoint(formValues)

  const onChange = () => {
    formValues.ceBonus = parseInt((document.getElementById("ce-bonus") as HTMLInputElement)?.value || "0") / 100
    formValues.useCeFixedBonus = (document.getElementById("ce-fixed-bonus") as HTMLInputElement)?.checked
    formValues.eventBonus = parseInt((document.getElementById("event-bonus") as HTMLInputElement)?.value || "0") / 100
    formValues.isStartUpBonus = (document.getElementById("start-up-bonus") as HTMLInputElement)?.checked
    formValues.isStartUpSupportBonus = (document.getElementById("start-up-support-bonus") as HTMLInputElement)?.checked
    formValues.useTeaPot = (document.getElementById("tea-pot") as HTMLInputElement)?.checked
    storage.saveFormValues(formValues)

    setFormValues({ ...formValues})
  }

  const onQuestBondChanged = () => {
    const value = parseInt((document.getElementById("quest") as HTMLInputElement).value || "0")
    formValues.questBond = value
    storage.saveFormValues(formValues)
    setFormValues({ ...formValues})
  }

  const onQuestlevelChanged = (event: SelectChangeEvent) => {
    const value = event.target.value as string
    if (value && value !== directInputKey) {
      const newQuestBond = questLevelAndBonds.find((v) => v.level === value)
      formValues.questBond = newQuestBond?.bond || 0
      storage.saveFormValues(formValues)
      setFormValues({ ...formValues})
    }
  }

  const onCopyResult = () => {
    navigator.clipboard.writeText(calcBondPoint(formValues).toString())
  }

  return (
    <div className="QuestBondCalculator" style={{padding: 10}}>
      FGO クエスト絆ポイント計算機
      <p/>
      <form>
        <FormControl fullWidth>
          <InputLabel>クエスト推奨レベル</InputLabel>
          <Select id="quest-lv" label="クエスト推奨レベル" variant="outlined" fullWidth sx={{ mb: 2 }} value={questLevel} onChange={onQuestlevelChanged}>
            {questLevelAndBonds.map((v) => {
                  return <MenuItem value={v.level} key={`candidates-${v.level}`}>{v.level}</MenuItem>
            })}
          </Select>
        </FormControl>
        <TextField id="quest" label="クエスト絆ポイント" variant="outlined" type="number" inputProps={{inputMode:"numeric"}} fullWidth sx={{ mb: 2 }}  value={formValues.questBond} onChange={onQuestBondChanged} />
        <TextField id="ce-bonus" label="礼装ボーナス(肖像は除く)" variant="outlined" type="number" inputProps={{inputMode:"numeric", min:0}} fullWidth sx={{ mb: 2 }} value={Math.round(formValues.ceBonus * 100)} onChange={onChange} InputProps={{endAdornment: <InputAdornment position="end">%</InputAdornment>}} />
        <TextField id="event-bonus" label="イベントボーナス" variant="outlined" type="number" inputProps={{inputMode:"numeric", min:0}} fullWidth sx={{ mb: 2 }} value={Math.round(formValues.eventBonus * 100)} onChange={onChange} InputProps={{endAdornment: <InputAdornment position="end">%</InputAdornment>}} />
        <FormControlLabel control={<Checkbox id="ce-fixed-bonus" />} label="肖像" onChange={onChange} checked={formValues.useCeFixedBonus} />
        <FormControlLabel control={<Checkbox id="start-up-bonus" />} label="前衛" onChange={onChange} checked={formValues.isStartUpBonus}  />
        <FormControlLabel control={<Checkbox id="start-up-support-bonus" />} label="サポート前衛" onChange={onChange} checked={formValues.isStartUpSupportBonus}  />
        <br/>
        <FormControlLabel control={<Checkbox id="tea-pot" />} label="星見のティーポット" onChange={onChange} checked={formValues.useTeaPot}  />
      </form>
      <TextField id="result" label="結果" variant="outlined" value={bondPoint} fullWidth sx={{ mt: 5 }} InputProps={{endAdornment: <IconButton onClick={onCopyResult}><ContentCopyIcon /></IconButton> }} />
    </div>
  );
}

export default QuestBondCalculator;

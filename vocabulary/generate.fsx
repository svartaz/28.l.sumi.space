open System
open System.Diagnostics
open System.IO
open System.Text.RegularExpressions

(*
         jjj www
  ieaouy aou iea
g !      !!!
ck
xh!      !!! !!!
šž       !!! !!!
n            !!!
dt       !!!
sz!      !!!
m            !!!
bp           !!!
fv           !!!
r        !!! !!!
*)
let syllables =
    [ for initial in
          [ "g" // [ŋ]
            "n"
            "m"
            "c" // [g]
            "d"
            "b"
            "k"
            "t"
            "p"
            "x"
            "š" // [ɕ]
            "s"
            "f"
            //"h" // [ɣ]
            "ž" // [ʑ]
            "z"
            "v"
            "r"
            "cr"
            "dr"
            "br"
            "kn"
            "kš"
            "ks"
            "kf"
            "kr"
            "tš"
            "ts"
            "tf"
            "tr"
            "pn"
            "pš"
            "ps"
            "pr"
            "sg"
            "sn"
            "sm"
            "sk"
            "st"
            "sp"
            "fr" ] do
          for vowel in [ "i"; "y"; "u"; "e"; "a"; "o"; "ja"; "jo"; "ju"; "wi"; "we"; "wa" ] do
              for coda in [ ""; "n"; "t"; "x"; "s"; "f"; "r" ] do
                  let syllable = initial + vowel + coda

                  if
                      not (Regex.IsMatch(syllable, @"(.)[jw]?[ieaou]\1|..[jw]|[gxhsz]i|[gxhšždtszr]j|[xhšžnmbpfvr]w"))
                  then
                      yield syllable ]


let pathResourceDir = Path.Combine(__SOURCE_DIRECTORY__, "resource")
let pathDirIn = Path.Combine(__SOURCE_DIRECTORY__, "input")
let pathDirOut = Path.Combine(__SOURCE_DIRECTORY__, "output")

Directory.CreateDirectory(pathDirOut) |> ignore

let pathDictionaryEn = Path.Combine(pathResourceDir, "dictionary-en.tsv")
let pathGismuTsv = Path.Combine(pathDirOut, "gismu_english_order.tsv")

let pathGismuToDefinition = Path.Combine(pathDirIn, "gismu_to_definition.tsv")

let pathSyllables = Path.Combine(pathDirOut, "syllables.txt")
let pathFull = Path.Combine(pathDirOut, "full.tsv")
let pathDefined = Path.Combine(pathDirOut, "defined.tsv")


printfn "%d syllables" syllables.Length
File.WriteAllLines(pathSyllables, syllables)

let normalizeWhitespace (text: string) = Regex.Replace(text.Trim(), @"\s+", " ")

let isSimpleHeadword (text: string) = Regex.IsMatch(text, @"^[a-z'.]+$")

let overrideLexiconRows =
    File.ReadLines(pathGismuToDefinition)
    |> Seq.choose (fun line ->
        let fields = line.Split '\t'
        let word = if fields.Length > 0 then fields[0].Trim() else ""
        let keyword = if fields.Length > 1 then fields[1].Trim() else ""
        let definition = if fields.Length > 4 then fields[4].Trim() else ""

        if
            String.IsNullOrWhiteSpace word
            || word.StartsWith("#")
            || String.IsNullOrWhiteSpace definition
        then
            None
        else
            Some(word, keyword, definition))
    |> Seq.toList

let generatedOverrideRows =
    File.ReadLines(pathGismuToDefinition)
    |> Seq.choose (fun line ->
        let fields = line.Split '\t'
        let word = if fields.Length > 0 then fields[0].Trim() else ""
        let keyword = if fields.Length > 1 then fields[1].Trim() else ""
        let date = if fields.Length > 2 then fields[2].Trim() else ""
        let wordClass = if fields.Length > 3 then fields[3].Trim() else ""
        let definition = if fields.Length > 4 then fields[4].Trim() else ""

        if
            (not (String.IsNullOrWhiteSpace word) && not (word.StartsWith "="))
            || String.IsNullOrWhiteSpace keyword
            || String.IsNullOrWhiteSpace definition
        then
            None
        else
            let fixedSyllable =
                if word.StartsWith "=" then
                    Some(word.Substring(1))
                else
                    None

            Some(keyword, date, wordClass, definition, fixedSyllable))
    |> Seq.toList

let overrideWords =
    overrideLexiconRows |> List.map (fun (word, _, _) -> word) |> Set.ofList

let parsedLexiconEntries =
    let lines = File.ReadAllLines pathDictionaryEn
    let header = lines[0].Split '\t'
    let headerIndex = header |> Array.mapi (fun i name -> name, i) |> Map.ofArray

    let fieldAt fieldName (fields: string array) =
        match Map.tryFind fieldName headerIndex with
        | Some index when index < fields.Length -> fields[index].Trim()
        | _ -> ""

    let dictionaryEntries =
        lines
        |> Seq.skip 1
        |> Seq.map (fun line ->
            let fields = line.Split '\t'
            let word = fieldAt "word" fields
            let entryType = fieldAt "type" fields |> normalizeWhitespace

            let rafsi =
                fieldAt "rafsi" fields
                |> normalizeWhitespace
                |> fun value -> value.Split(' ', StringSplitOptions.RemoveEmptyEntries)
                |> Array.filter isSimpleHeadword
                |> String.concat " "

            let definition = fieldAt "definition" fields |> normalizeWhitespace
            let primaryKeyword = fieldAt "glossword_1" fields |> normalizeWhitespace
            let secondaryKeyword = fieldAt "glossword_2" fields |> normalizeWhitespace
            word, entryType, rafsi, primaryKeyword, secondaryKeyword, definition)
        |> Seq.filter (fun (word, entryType, _, _, _, definition) ->
            isSimpleHeadword word
            && (entryType = "gismu" || (entryType = "cmavo" && Set.contains word overrideWords))
            && not (String.IsNullOrWhiteSpace definition))
        |> Seq.toList

    let dictionaryWords =
        dictionaryEntries |> List.map (fun (word, _, _, _, _, _) -> word) |> Set.ofList

    let fallbackEntries =
        overrideLexiconRows
        |> List.choose (fun (word, keyword, definition) ->
            if Set.contains word dictionaryWords || not (isSimpleHeadword word) then
                None
            else
                Some(word, "override", "", keyword, "", normalizeWhitespace definition))

    dictionaryEntries @ fallbackEntries
    |> List.distinctBy (fun (word, _, _, _, _, _) -> word)
    |> List.sortBy (fun (_, _, _, primaryKeyword, secondaryKeyword, definition) ->
        primaryKeyword, secondaryKeyword, definition)

printfn
    "%d gismu"
    (parsedLexiconEntries
     |> List.filter (fun (_, entryType, _, _, _, _) -> entryType = "gismu")
     |> List.length)

printfn
    "%d cmavo"
    (parsedLexiconEntries
     |> List.filter (fun (_, entryType, _, _, _, _) -> entryType = "cmavo")
     |> List.length)

printfn "%d generated overrides" generatedOverrideRows.Length

File.WriteAllLines(
    pathGismuTsv,
    parsedLexiconEntries
    |> List.map (fun (word, entryType, rafsi, primaryKeyword, secondaryKeyword, definition) ->
        $"{word}\t{rafsi}\t{primaryKeyword}\t{secondaryKeyword}\t{definition}\t{entryType}")
)

let isVowel c = Set.contains c (set "iyueao")

let hasCoda (syllable: string) =
    not (isVowel syllable[syllable.Length - 1])

let syllablesWithCoda = syllables |> List.filter hasCoda
let syllableArray = List.toArray syllables
let syllablePriorityArray: float array = Array.zeroCreate syllableArray.Length
let allSyllableIndices = Array.init syllableArray.Length id

let syllablesWithCodaIndices =
    syllableArray
    |> Array.mapi (fun index syllable -> index, syllable)
    |> Array.choose (fun (index, syllable) -> if hasCoda syllable then Some index else None)

let normalizeGismu =
    String.collect (function
        | '\'' -> "h"
        | '.' -> ""
        | 'c' -> "š"
        | 'g' -> "c"
        | 'j' -> "ž"
        | 'l' -> "r"
        | 'y' -> "i"
        | c -> string c)

let scoreCandidate =
    let ccvcv = Regex("^[^aeiou]{2}[aeiou][^aeiou][aeiou]$")
    let cvccv = Regex("^[^aeiou][aeiou][^aeiou]{2}[aeiou]$")

    (*
    g  n  m
    c  d  b  k  t  p
    h ž z v  x š s f
      j r w
      i   u      y
      e   o      a
    *)
    let space =
        Map.ofList
            [ ('g', (0., 0., 0.))
              ('n', (0., 0., 1.5))
              ('m', (0., 0., 3.))
              ('c', (0., 1., 0))
              ('d', (0., 1., 1.5))
              ('b', (0., 1., 3.))
              ('k', (1., 1., 0))
              ('t', (1., 1., 1.5))
              ('p', (1., 1., 3.))
              ('x', (1., 2., 0))
              ('š', (1., 2., 1.))
              ('s', (1., 2., 2.))
              ('f', (1., 2., 3.))
              ('h', (0., 2., 0))
              ('ž', (0., 2., 1.))
              ('z', (0., 2., 2.))
              ('v', (0., 2., 3.))
              ('j', (0., 3., 1.))
              ('r', (0., 3., 2.))
              ('w', (0., 4., 3.))
              ('i', (0., 4., 1.))
              ('u', (0., 4., 3.))
              ('y', (1., 4., 2.))
              ('e', (0., 5., 1.))
              ('o', (0., 5., 3.))
              ('a', (1., 5., 2.)) ]

    let substitutionCost left right =
        let (x0, y0, z0) = space[left]
        let (x1, y1, z1) = space[right]
        sqrt ((x1 - x0) ** 2. + (y1 - y0) ** 2. + (z1 - z0) ** 2.)

    let nearestNeighborDistance =
        space.Keys
        |> Seq.map (fun token ->
            let nearest =
                space.Keys
                |> Seq.filter ((<>) token)
                |> Seq.map (substitutionCost token)
                |> Seq.min

            token, nearest)
        |> Map.ofSeq

    let insertionCost token =
        nearestNeighborDistance[token] + if isVowel token then 0.4 else 0.25

    let weightedDistance (source: string) (target: string) =
        let rows = source.Length + 1
        let cols = target.Length + 1
        let dp = Array2D.zeroCreate<float> rows cols

        for row in 1 .. source.Length do
            dp[row, 0] <- dp[row - 1, 0] + insertionCost source.[row - 1]

        for col in 1 .. target.Length do
            dp[0, col] <- dp[0, col - 1] + insertionCost target.[col - 1]

        for row in 1 .. source.Length do
            for col in 1 .. target.Length do
                let delete = dp[row - 1, col] + insertionCost source.[row - 1]
                let insert = dp[row, col - 1] + insertionCost target.[col - 1]

                let substitute =
                    dp[row - 1, col - 1] + substitutionCost source.[row - 1] target.[col - 1]

                dp[row, col] <- min delete (min insert substitute)

        dp[source.Length, target.Length]

    fun (normalized: string) (candidate: string) ->
        let projectShapes =
            let chars = normalized.ToCharArray()

            [ normalized
              if ccvcv.IsMatch normalized then
                  String.Concat(chars.[0], chars.[1], chars.[2], chars.[3])
                  String.Concat(chars.[0], chars.[1], chars.[2])
              elif cvccv.IsMatch normalized then
                  String.Concat(chars.[0], chars.[1], chars.[2])
                  String.Concat(chars.[0], chars.[1], chars.[3])
                  String.Concat(chars.[0], chars.[1], chars.[2], chars.[3]) ]
            |> List.distinct

        let firstVowel = normalized |> Seq.tryFind isVowel

        let bonus =
            [ if normalized.[0] = candidate.[0] then
                  nearestNeighborDistance[normalized.[0]] * 0.75
              match firstVowel, candidate |> Seq.tryFind isVowel with
              | Some left, Some right when left = right -> nearestNeighborDistance[left] * 0.5
              | _ -> 0.0 ]
            |> List.sum

        projectShapes
        |> List.map (fun projection -> weightedDistance projection candidate - bonus)
        |> List.min

type DefinitionOverride =
    { Keyword: string
      Date: string
      WordClass: string
      Definition: string }

type HeadwordEntry =
    { Id: string
      Word: string
      EntryType: string
      WordClass: string
      FixedSyllable: string option
      Rafsi: string list
      EnglishKeyword: string
      Meaning: string
      ReferenceForms: string list
      DefinitionOverride: DefinitionOverride option }

type RankedCandidate =
    { Syllable: string
      Score: float
      LengthPenalty: int }

let fieldOrEmpty index (fields: string array) =
    if index < fields.Length then fields[index].Trim() else ""

let definitionOverrides =
    File.ReadLines(pathGismuToDefinition)
    |> Seq.choose (fun line ->
        let fields = line.Split '\t'

        if fields.Length < 5 then
            None
        else
            let word = fieldOrEmpty 0 fields
            let keyword = fieldOrEmpty 1 fields
            let date = fieldOrEmpty 2 fields
            let wordClass = fieldOrEmpty 3 fields
            let definition = fieldOrEmpty 4 fields

            if
                String.IsNullOrWhiteSpace word
                || word.StartsWith("#")
                || String.IsNullOrWhiteSpace definition
            then
                None
            else
                Some(
                    word,
                    { Keyword = keyword
                      Date = date
                      WordClass = wordClass
                      Definition = definition }
                ))
    |> Map.ofSeq

let dictionaryHeadwordEntries =
    File.ReadLines(pathGismuTsv)
    |> Seq.choose (fun line ->
        let fields = line.Split '\t'

        if fields.Length = 0 then
            None
        else
            let word = fieldOrEmpty 0 fields

            if String.IsNullOrWhiteSpace word then
                None
            else
                let rafsiForms =
                    let rafsiField = fieldOrEmpty 1 fields

                    if String.IsNullOrWhiteSpace rafsiField then
                        []
                    else
                        rafsiField.Split(' ', StringSplitOptions.RemoveEmptyEntries) |> Array.toList

                let englishKeyword =
                    [ fieldOrEmpty 2 fields; fieldOrEmpty 3 fields ]
                    |> List.filter (String.IsNullOrWhiteSpace >> not)
                    |> String.concat " "

                let defaultMeaning = fieldOrEmpty 4 fields
                let entryType = fieldOrEmpty 5 fields
                let definitionOverride = Map.tryFind word definitionOverrides

                let wordClass =
                    definitionOverride |> Option.map _.WordClass |> Option.defaultValue ""

                let meaning =
                    definitionOverride
                    |> Option.map _.Definition
                    |> Option.defaultValue defaultMeaning

                let referenceForms = if List.isEmpty rafsiForms then [ word ] else rafsiForms

                Some
                    { Id = word
                      Word = word
                      EntryType = entryType
                      WordClass = wordClass
                      FixedSyllable = None
                      Rafsi = rafsiForms
                      EnglishKeyword = englishKeyword
                      Meaning = meaning
                      ReferenceForms = referenceForms
                      DefinitionOverride = definitionOverride })
    |> Seq.distinct
    |> Seq.toList

let generatedHeadwordEntries =
    generatedOverrideRows
    |> List.mapi (fun index (keyword, date, wordClass, definition, fixedSyllable) ->
        { Id = $"_generated_{index}_{keyword}"
          Word = ""
          EntryType = "generated"
          WordClass = wordClass
          FixedSyllable = fixedSyllable
          Rafsi = []
          EnglishKeyword = keyword
          Meaning = definition
          ReferenceForms = []
          DefinitionOverride =
            Some
                { Keyword = keyword
                  Date = date
                  WordClass = wordClass
                  Definition = definition } })

let headwordEntries = dictionaryHeadwordEntries @ generatedHeadwordEntries

let assignmentSeed = 20579
let assignmentRandom = Random(assignmentSeed)

let shuffledPriorities items =
    items
    |> List.map (fun item -> item, assignmentRandom.NextDouble())
    |> Map.ofList

let headwordPriority = headwordEntries |> List.map _.Id |> shuffledPriorities

let syllablePriority = shuffledPriorities syllables

do
    syllableArray
    |> Array.iteri (fun index syllable -> syllablePriorityArray[index] <- syllablePriority[syllable])

[<Struct>]
type ScoredCandidate =
    { Index: int
      Score: float
      LengthPenalty: int }

type PreparedEntry =
    { Entry: HeadwordEntry
      Candidates: ScoredCandidate array
      PriorityGap: float }

let candidateIndicesFor entry =
    match entry.FixedSyllable with
    | Some fixedSyllable ->
        allSyllableIndices
        |> Array.filter (fun index -> syllableArray[index] = fixedSyllable)
    | None when entry.EntryType = "generated" ->
        allSyllableIndices
        |> Array.filter (fun index -> entry.WordClass = "verb" || syllableArray[index].Length <= 3)
    | None when entry.EntryType = "cmavo" ->
        allSyllableIndices
        |> Array.filter (fun index -> syllableArray[index].Length <= 3)
    | None -> syllablesWithCodaIndices

let isBetterCandidate left right =
    left.Score < right.Score
    || (left.Score = right.Score
        && (left.LengthPenalty < right.LengthPenalty
            || (left.LengthPenalty = right.LengthPenalty
                && syllablePriorityArray[left.Index] < syllablePriorityArray[right.Index])))

let prepareEntry entry =
    let normalizedReferences =
        entry.ReferenceForms |> List.map normalizeGismu |> List.distinct |> List.toArray

    let candidateIndices = candidateIndicesFor entry
    let candidates = Array.zeroCreate<ScoredCandidate> candidateIndices.Length

    let mutable best = Unchecked.defaultof<ScoredCandidate>
    let mutable second = Unchecked.defaultof<ScoredCandidate>
    let mutable foundBest = false
    let mutable foundSecond = false

    for candidatePosition in 0 .. candidateIndices.Length - 1 do
        let index = candidateIndices[candidatePosition]
        let syllable = syllableArray[index]
        let mutable candidateScore = 0.0
        let mutable candidateLengthPenalty = 0

        if normalizedReferences.Length > 0 then
            candidateScore <- Double.PositiveInfinity
            candidateLengthPenalty <- Int32.MaxValue

            for normalized in normalizedReferences do
                let score = scoreCandidate normalized syllable
                let lengthPenalty = abs (normalized.Length - syllable.Length)

                if
                    score < candidateScore
                    || (score = candidateScore && lengthPenalty < candidateLengthPenalty)
                then
                    candidateScore <- score
                    candidateLengthPenalty <- lengthPenalty

        let candidate =
            { Index = index
              Score = candidateScore
              LengthPenalty = candidateLengthPenalty }

        candidates[candidatePosition] <- candidate

        if not foundBest || isBetterCandidate candidate best then
            if foundBest then
                second <- best
                foundSecond <- true

            best <- candidate
            foundBest <- true
        elif not foundSecond || isBetterCandidate candidate second then
            second <- candidate
            foundSecond <- true

    let priorityGap =
        if foundSecond then
            second.Score - best.Score
        else
            Double.PositiveInfinity

    { Entry = entry
      Candidates = candidates
      PriorityGap = priorityGap }

let scoringStopwatch = Stopwatch.StartNew()

let preparedEntries =
    headwordEntries
    |> List.toArray
    |> Array.Parallel.map prepareEntry
    |> Array.toList

scoringStopwatch.Stop()
printfn "scored in %d ms" scoringStopwatch.ElapsedMilliseconds

let tryPickBestAvailable (availableSyllables: bool array) (candidates: ScoredCandidate array) =
    let mutable best = Unchecked.defaultof<ScoredCandidate>
    let mutable found = false

    for candidate in candidates do
        if
            availableSyllables[candidate.Index]
            && (not found || isBetterCandidate candidate best)
        then
            best <- candidate
            found <- true

    if found then Some best else None

let assignmentStopwatch = Stopwatch.StartNew()

let assignments =
    let availableSyllables = Array.create syllableArray.Length true

    preparedEntries
    |> List.sortBy (fun preparedEntry ->
        let typePriority =
            if preparedEntry.Entry.FixedSyllable.IsSome then -1
            elif preparedEntry.Entry.EntryType = "generated" then 2
            elif preparedEntry.Entry.EntryType = "cmavo" then 1
            else 0

        typePriority, preparedEntry.PriorityGap, headwordPriority[preparedEntry.Entry.Id])
    |> List.choose (fun preparedEntry ->
        match tryPickBestAvailable availableSyllables preparedEntry.Candidates with
        | Some best ->
            availableSyllables[best.Index] <- false
            Some(preparedEntry.Entry, syllableArray[best.Index])
        | None -> None)

assignmentStopwatch.Stop()
printfn "assigned in %d ms" assignmentStopwatch.ElapsedMilliseconds

printfn "%d headwords" headwordEntries.Length

let assignmentsBySyllable =
    assignments |> List.map (fun (entry, syllable) -> syllable, entry) |> Map.ofList

File.WriteAllLines(
    pathFull,
    syllables
    |> List.map (fun syllable ->
        match Map.tryFind syllable assignmentsBySyllable with
        | Some entry ->
            let rafsiText = String.concat " " entry.Rafsi

            let outputWord =
                if String.IsNullOrWhiteSpace entry.Word then
                    syllable
                else
                    entry.Word

            $"{syllable}\t{outputWord}\t{rafsiText}\t{entry.EnglishKeyword}\t{entry.Meaning}"
        | None -> $"{syllable}\t\t\t\t")
)

File.WriteAllLines(
    pathDefined,
    syllables
    |> List.choose (fun syllable ->
        match Map.tryFind syllable assignmentsBySyllable with
        | Some entry ->
            entry.DefinitionOverride
            |> Option.map (fun definitionOverride ->
                $"{syllable}\t{entry.Word}\t{definitionOverride.Keyword}\t{definitionOverride.Date}\t{definitionOverride.WordClass}\t{definitionOverride.Definition}")
        | None -> None)
)

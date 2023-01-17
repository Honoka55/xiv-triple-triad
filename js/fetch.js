async function loadCards() {
    try {
        let response = await fetch('https://ff14.huijiwiki.com/api/rest_v1/namespace/data?filter={%22data_type%22:%22Card%22}&sort_by=ID&pagesize=900');
        let data = await response.json();
        return data._embedded;
    } catch (error) {
        console.log('Error loading remote JSON file. Loading local file...');
        try {
            let response = await fetch('../data/cards.json');
            let data = await response.json();
            return data._embedded;
        } catch (error) {
            console.error(error);
        }
    }
}

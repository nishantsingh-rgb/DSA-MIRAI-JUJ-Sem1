#include <iostream>
#include <algorithm>
#include <vector>
using namespace std;

int main() {
    vector<int> v = {4, 6, 2, 6, 4, 4, 9, 2, 6, 6};
    int freq[10] = {0};                             // values are 0..9
    for (int x : v) {
        freq[x]++;
    }

    sort(v.begin(), v.end(), [&](int a, int b) {
        if (freq[a] != freq[b]) {
            return freq[a] > freq[b];               // more frequent first
        }
        return a < b;                               // tie: smaller value first
    });

    cout << "By frequency: ";
    for (int x : v) {
        cout << x << " ";
    }
    cout << endl;
    return 0;
}

#include <iostream>
#include <vector>
using namespace std;

int countOccurrences(const vector<int> &arr, int x) {
    int count = 0;
    for (int value : arr) {
        if (value == x) {
            count++;                    // do not stop: keep counting
        }
    }
    return count;
}

int main() {
    vector<int> arr = {2, 5, 2, 8, 2, 5, 1};

    cout << "2 appears " << countOccurrences(arr, 2) << " times" << endl;
    cout << "5 appears " << countOccurrences(arr, 5) << " times" << endl;
    cout << "7 appears " << countOccurrences(arr, 7) << " times" << endl;
    return 0;
}
